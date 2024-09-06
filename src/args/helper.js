import fs from "fs";
import { Groq } from "groq-sdk";

let state = {
  isInputFile: false, // is input file provided or url provided
  inputFile: "",
  outputFile: "",
  url: "",
  apiKey: "",
};

// will validate the arguments provided and populate the state object.
export function validateArgs(args) {
  // check if the the url is provided asx an argument
  if (args.includes("-url")) {
    const index = args.indexOf("-url");
    if (args.length <= index + 1) {
      console.error("Please provide a valid url");
      process.exit(1);
    }
    state.url = args[index + 1];
    state.isInputFile = false;
  } else {
    const [, , inputFile] = args;
    if (!inputFile) {
      console.error("Please provide the input file");
      process.exit(1);
    }

    // check if the input file exists
    if (!fs.existsSync(inputFile)) {
      console.error("The input file does not exist");
      process.exit(1);
    }
    state.inputFile = inputFile;
    state.isInputFile = true;
  }

  // check if the outfile file is provided
  if (args.includes("-0")) {
    const index = args.indexOf("-0");
    if (args.length <= index + 1) {
      console.error("Please provide the output file");
      process.exit(1);
    }
    state.outputFile = args[index + 1];
  }

  //  checl if the api key is proivded
  if (args.includes("-key")) {
    const index = args.indexOf("-key");
    if (args.length <= index + 1) {
      console.error("Please provide a valid api key");
      process.exit(1);
    }
    process.env.GROQ_API_KEY = args[index + 1];
    state.apiKey = args[index + 1];
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
      console.error("Error occurred while making the URL call:", error);
      process.exit(1);
    });

  // trim the body so that it only contains the body
  body = body.substring(body.indexOf("<body"), body.indexOf("</body>") + 7);

  return body;
}

export async function convertIntoMd(body) {
  const groq = new Groq({
    apiKey: state.apiKey ? state.apiKey : process.env.GROQ_API_KEY,
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

  response = response.replace("{{", "").replace("}}", "");
  return response;
}

export function saveMd(md) {
  if (state.outputFile) {
    fs.writeFileSync(state.outputFile, md);
  } else {
    // wirte the md to the ipput file
    fs.writeFileSync(state.inputFile + ".md", md);
  }
}
