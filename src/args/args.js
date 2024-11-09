import { getConfigOptions } from './helper.js'
import path from 'path'
import fs from 'fs'

let state = {
  isInputFile: false, // is input file provided or url provided
  inputFile: '',
  outputFile: '',
  url: '',
  apiKey: '',
  tokenUsage: false,
  stream: false
}

const helpTxt = `Usage: scrappy [options] <inputFile> <outputFile> <url>

Options:
  -h, --help          Display this help message
  -i, --input         Specify the input file
  -o, --output        Specify the output file
  -u, --url           Specify the URL to scrape
  -v, --version       DIsplay the version of the tool
  -t, --token-usage   Display the token usage
Examples:
  scrappy -i input.txt -o output.md
  scrappy -u https://example.com -o output

Description:
  Scrappy is a tool that converts any website that can be scraped into a markdown file.
  You can specify an input file, output file, or URL to scrape.
`

export async function validateArgs(args) {
  let configOptions = getConfigOptions()

  // check if the api key is proivded
  if (args.includes('--api-key') || args.includes('-a')) {
    let index
    if (args.includes('-a')) {
      index = args.indexOf('-a')
    } else {
      index = args.indexOf('--api-key')
    }
    if (args.length <= index + 1) {
      process.stderr.write('Please provide a valid api key')
      process.exit(1)
    }
    process.env.GROQ_API_KEY = args[index + 1]
    state.apiKey = args[index + 1]
    // Write the API key to the .env file
    const envFilePath = path.resolve(__dirname, '../..', '.env')
    fs.appendFileSync(envFilePath, `GROQ_API_KEY=${state.apiKey}\n`, 'utf8')

    process.stdout.write('API key updated and written to .env file')
    return false
  }

  //  check if the version flag is passed.
  if (args.includes('-v') || args.includes('--version')) {
    process.stdout.write('Version 1.0.0')
    return false
  }

  //  check if the help flag is passed.
  if (args.includes('-h') || args.includes('--help')) {
    process.stdout.write(helpTxt)
    return false
  }

  process.stdout.write('Validating the arguments... ')

  // Use URL CLI option if present
  // If missing, use input file argument if present
  // If missing, use URL config option if present
  // If missing, use input file config option if present
  // If missing, exit
  if (args.includes('--url') || args.includes('-u')) {
    let index
    if (args.includes('-u')) {
      index = args.indexOf('-u')
    } else {
      index = args.indexOf('--url')
    }

    if (args.length <= index + 1) {
      process.stderr.write('Please provide a valid url')
      process.exit(1)
    }

    state.url = args[index + 1]
    state.isInputFile = false
  } else {
    let [, , inputFile] = args // Check if the input file is supplied as an argument
    if (!inputFile) {
      if (configOptions?.url) {
        state.url = configOptions.url
      } else if (configOptions?.inputFile) {
        state.inputFile = configOptions.inputFile
      } else {
        process.stderr.write('Please provide the input file')
        process.exit(1)
      }
    }

    // check if the input file exists
    if (!fs.existsSync(inputFile)) {
      console.log(inputFile)
      process.stderr.write('The input file does not exist')
      process.exit(1)
    }
    state.inputFile = inputFile
    state.isInputFile = true
  }

  // check if the outfile file is provided
  if (args.includes('-o') || args.includes('--output')) {
    let index
    if (args.includes('-o')) {
      index = args.indexOf('-o')
    } else {
      index = args.indexOf('--output')
    }
    if (index === -1) {
      index = args.indexOf('--output')
      if (args.length <= index + 1) {
        process.stderr.write('Please provide the output file')
        process.exit(1)
      }
    }
    state.outputFile = args[index + 1]
  } else if (configOptions?.outputFile) {
    state.outputFile = configOptions.outputFile
  }

  // check if the token usage flag is passed
  if (args.includes('-t') || args.includes('--token-usage')) {
    let index
    if (args.includes('-t')) {
      index = args.indexOf('-t')
    } else {
      index = args.indexOf('--token-usage')
    }

    state.tokenUsage = true
  } else if (configOptions?.tokenUsage) {
    state.tokenUsage = configOptions.tokenUsage
  }

  // check if the stream flag is passed --stream/-s
  if (args.includes('--stream') || args.includes('-s')) {
    state.stream = true
  } else if (configOptions?.stream) {
    state.stream = configOptions.stream
  }

  return state
}
