import fs from "fs";
import { Groq } from "groq-sdk";

const helpTxt = `Usage: scrappy [options] <inputFile> <outputFile> <url>

Options:
  -h, --help      Display this help message
  -i, --input     Specify the input file
  -o, --output    Specify the output file
  -u, --url       Specify the URL to scrape

Examples:
  scrappy -i input.txt -o output.md
  scrappy -u https://example.com -o output.md

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
};

// will validate the arguments provided and populate the state object.
export function validateArgs(args) {
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
    process.stdout.write("API key updated");
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

  // check if the the url is provided asx an argument
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
  } else {
    const [, , inputFile] = args;
    if (!inputFile) {
      process.stderr.write("Please provide the input file");
      process.exit(1);
    }

    // check if the input file exists
    if (!fs.existsSync(inputFile)) {
      process.stderr.write("The input file does not exist");
      process.exit(1);
    }
    state.inputFile = inputFile;
    state.isInputFile = true;
  }

  // check if the outfile file is provided
  if (args.includes("-0") || args.includes("--output")) {
    let index;
    if (args.includes("-0")) {
      index = args.indexOf("-0");
    } else {
      index = args.indexOf("--output");
    }
    if (index === -1) {
      index = args.indexOf("--output");
      if (args.length <= index + 1) {
        process.stderr.write("Please provide the output file");
        process.exit(1);
      }
      state.outputFile = args[index + 1];
    }

    return state;
  }
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

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: system_message,
      },
    ],
    model: "llama3-8b-8192",
    temperature: 1,
    max_tokens: 1024,
    top_p: 1,
    stream: true,
    stop: null,
  });

  for await (const chunk of chatCompletion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
    response += chunk.choices[0]?.delta?.content || "";
  }

  //remove the first line
  response = response.substring(response.indexOf("\n") + 1);
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
