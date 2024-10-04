import fs from "fs";
import fsP from "fs/promises";
import os from "os";
import { Groq } from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";
import TOML from "smol-toml";
import dotenv from "dotenv";
dotenv.config();

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
`;

let state = {
  isInputFile: false, // is input file provided or url provided
  inputFile: "",
  outputFile: "",
  url: "",
  apiKey: "",
  tokenUsage: false,
  stream: false,
};

// will validate the arguments provided and populate the state object.
export async function validateArgs(args) {
  let configOptions;
  try {
    const configFilePath = path.join(os.homedir(), ".scrappy.toml");
    configOptions = await parseConfig(configFilePath);
  } catch (error) {
    // If file found but couldn't be parsed, exit
    if (error.code !== "ENOENT") {
      process.stderr.write(error.toString());
      process.exit(1);
    }
  }

  // check if the api key is proivded
  if (args.includes("--api-key") || args.includes("-a")) {
    let index;
    if (args.includes("-a")) {
      index = args.indexOf("-a");
    } else {
      index = args.indexOf("--api-key");
    }
    if (args.length <= index + 1) {
      process.stderr.write("Please provide a valid api key");
      process.exit(1);
    }
    process.env.GROQ_API_KEY = args[index + 1];
    state.apiKey = args[index + 1];
    // Write the API key to the .env file
    const envFilePath = path.resolve(__dirname, "../..", ".env");
    fs.appendFileSync(envFilePath, `GROQ_API_KEY=${state.apiKey}\n`, "utf8");

    process.stdout.write("API key updated and written to .env file");
    return false;
  }

  //  check if the version flag is passed.
  if (args.includes("-v") || args.includes("--version")) {
    process.stdout.write("Version 1.0.0");
    return false;
  }

  //  check if the help flag is passed.
  if (args.includes("-h") || args.includes("--help")) {
    process.stdout.write(helpTxt);
    return false;
  }

  process.stdout.write("Validating the arguments... ");

  // Use URL CLI option if present
  // If missing, use URL config option if present
  // If missing, use input file argument if present
  // If missing, use input file config option if present
  // If missing, exit
  if (args.includes("--url") || args.includes("-u")) {
    let index;
    if (args.includes("-u")) {
      index = args.indexOf("-u");
    } else {
      index = args.indexOf("--url");
    }

    if (args.length <= index + 1) {
      process.stderr.write("Please provide a valid url");
      process.exit(1);
    }
    state.url = args[index + 1];
    state.isInputFile = false;
  } else if (configOptions?.url) {
    state.url = configOptions.url;
  } else {
    let [, , inputFile] = args; // Check if the input file is supplied as an argument
    inputFile = inputFile || configOptions?.inputFile; // If not, try to get it from the config
    if (!inputFile) {
      process.stderr.write("Please provide the input file");
      process.exit(1);
    }

    // check if the input file exists
    if (!fs.existsSync(inputFile)) {
      console.log(inputFile);
      process.stderr.write("The input file does not exist");
      process.exit(1);
    }
    state.inputFile = inputFile;
    state.isInputFile = true;
  }

  // check if the outfile file is provided
  if (args.includes("-o") || args.includes("--output")) {
    let index;
    if (args.includes("-o")) {
      index = args.indexOf("-o");
    } else {
      index = args.indexOf("--output");
    }
    if (index === -1) {
      index = args.indexOf("--output");
      if (args.length <= index + 1) {
        process.stderr.write("Please provide the output file");
        process.exit(1);
      }
    }
    state.outputFile = args[index + 1];
  } else if (configOptions?.outputFile) {
    state.outputFile = configOptions.outputFile;
  }

  // check if the token usage flag is passed
  if (args.includes("-t") || args.includes("--token-usage")) {
    let index;
    if (args.includes("-t")) {
      index = args.indexOf("-t");
    } else {
      index = args.indexOf("--token-usage");
    }

    state.tokenUsage = true;
  } else if (configOptions?.tokenUsage) {
    state.tokenUsage = configOptions.tokenUsage;
  }

  // check if the stream flag is passed --stream/-s
  if (args.includes("--stream") || args.includes("-s")) {
    state.stream = true;
  } else if (configOptions?.stream) {
    state.stream = configOptions.stream;
  }

  return state;
}

// gets the body of the url provided
export async function getUrlBody(url) {
  let body;
  await fetch(url)
    .then((response) => response.text())
    .then((responseBody) => {
      body = responseBody;
    })
    .catch((error) => {
      process.stderr.write("Error occurred while making the URL call:", error);
      process.exit(1);
    });

  // trim the body so that it only contains the body
  body = body.substring(body.indexOf("<body"), body.indexOf("</body>") + 7);

  return body;
}

export async function convertIntoMd(body) {
  const apiKey = state.apiKey ? state.apiKey : process.env.GROQ_API_KEY;

  if (!apiKey) {
    process.stderr.write(
      "API Key is missing. Add an api key using --api-key or -a flag"
    );
    process.exit(1);
  }

  const groq = new Groq({
    apiKey: apiKey,
  });

  let system_message =
    "You are given a body of a webpage, Convert the body into markdown. Make sure that the style nd the structure of the page is preserved." +
    "make sure you are not leaving any incomplete bullet points" +
    "The markdown should be readable and should be able to render the page as it is. Dont return any html tags, return the text with the markdown best guidelines." +
    " -> " +
    body;
  let response = "";
  let promptTokens = 0;
  let responseTokens = 0;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: system_message,
      },
    ],
    model: "llama3-8b-8192",
    temperature: 1,
    max_tokens: 4097,
    top_p: 1,
    stream: true,
    stop: null,
  });

  for await (const chunk of chatCompletion) {
    response += chunk.choices[0]?.delta?.content || "";
    if (state.stream) {
      process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }
    if (chunk.x_groq?.usage) {
      promptTokens += chunk.x_groq?.usage?.prompt_tokens;
      responseTokens += chunk.x_groq?.usage?.completion_tokens;
    }
  }

  //remove the first line
  response = response.substring(response.indexOf("\n") + 1);

  if (state.tokenUsage) {
    process.stdout.write(`\nPrompt Tokens: ${promptTokens}\n`);
    process.stdout.write(`Response Tokens: ${responseTokens}\n`);
  }

  return response;
}

export function saveMd(md) {
  if (state.outputFile) {
    fs.writeFileSync(state.outputFile + ".md", md);
  } else {
    // wirte the md to the ipput file
    fs.writeFileSync(state.inputFile + ".md", md);
  }
}

/**
 * Parses a TOML config file for options
 * @param {string} configFilePath Path to .toml config file
 * @returns {{ url: string | undefined, inputFile: string | undefined, outputFile: string | undefined, tokenUsage: boolean | undefined, stream: boolean | undefined }} An object containing the parsed options
 */
export async function parseConfig(configFilePath) {
  const configfileContent = await fsP.readFile(configFilePath, {
    encoding: "utf8",
  });
  const configOptions = TOML.parse(configfileContent);
  return configOptions;
}
