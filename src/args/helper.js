import fs from 'fs'
import fsP from 'fs/promises'
import os from 'os'
import { Groq } from 'groq-sdk'
import path from 'path'
import { fileURLToPath } from 'url'
import TOML from 'smol-toml'
import dotenv from 'dotenv'
import { get } from 'http'
dotenv.config()

let state = {
  isInputFile: false, // is input file provided or url provided
  inputFile: '',
  outputFile: '',
  url: '',
  apiKey: '',
  tokenUsage: false,
  stream: false
}

export function updateState(newState) {
  state = { ...state, ...newState }
}

// gets the body of the url provided
export async function getUrlBody(url) {
  let body
  await fetch(url)
    .then((response) => response.text())
    .then((responseBody) => {
      body = responseBody
    })
    .catch((error) => {
      process.stderr.write('Error occurred while making the URL call:', error)
      process.exit(1)
    })

  // trim the body so that it only contains the body
  body = body.substring(body.indexOf('<body'), body.indexOf('</body>') + 7)

  return body
}

export async function convertIntoMd(body) {
  const apiKey = state.apiKey ? state.apiKey : process.env.GROQ_API_KEY
  if (!apiKey) {
    process.stderr.write(
      'API Key is missing. Add an api key using --api-key or -a flag'
    )
    process.exit(1)
  }
  const groq = new Groq({
    apiKey: apiKey
  })
  return await getGroqResponse(body, groq)
}

export async function getGroqResponse(body, groq) {
  let system_message =
    'You are given a body of a webpage, Convert the body into markdown. Make sure that the style nd the structure of the page is preserved.' +
    'make sure you are not leaving any incomplete bullet points' +
    'The markdown should be readable and should be able to render the page as it is. Dont return any html tags, return the text with the markdown best guidelines.' +
    ' -> ' +
    body
  let response = ''
  let promptTokens = 0
  let responseTokens = 0

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: system_message
      }
    ],
    model: 'llama3-8b-8192',
    temperature: 1,
    max_tokens: 4097,
    top_p: 1,
    stream: true,
    stop: null
  })

  for await (const chunk of chatCompletion) {
    response += chunk.choices[0]?.delta?.content || ''
    if (state.stream) {
      process.stdout.write(chunk.choices[0]?.delta?.content || '')
    }
    if (chunk.x_groq?.usage) {
      promptTokens += chunk.x_groq?.usage?.prompt_tokens
      responseTokens += chunk.x_groq?.usage?.completion_tokens
    }
  }

  if (state.tokenUsage) {
    process.stdout.write(`\nPrompt Tokens: ${promptTokens}\n`)
    process.stdout.write(`Response Tokens: ${responseTokens}\n`)
  }

  return response
}

export function saveMd(md) {
  if (state.outputFile) {
    fs.writeFileSync(state.outputFile + '.md', md)
  } else {
    // wirte the md to the ipput file
    fs.writeFileSync(state.inputFile + '.md', md)
  }
}

/**
 * Parses a TOML config file for options
 * @param {string} configFilePath Path to .toml config file
 * @returns {{ url: string | undefined, inputFile: string | undefined, outputFile: string | undefined, tokenUsage: boolean | undefined, stream: boolean | undefined }} An object containing the parsed options
 */
export async function getConfigOptions() {
  try {
    const configFilePath = path.join(os.homedir(), '.scrappy.toml')
    const configfileContent = await fsP.readFile(configFilePath, {
      encoding: 'utf8'
    })
    return TOML.parse(configfileContent)
  } catch (error) {
    // If file found but couldn't be parsed, exit
    if (error.code !== 'ENOENT') {
      process.stderr.write(error.toString())
      process.exit(1)
    }
  }
}
