# Scrappy

<p align="center">
  <img width="50%" src="./assets/scrappy.jpeg"><br /><br />
  <strong>Scrappy is a command line tool that will convert any website that can be scraped into a markdown.</strong><br /><br />
</p>

<p align="center">
  <a href="https://github.com/KrinsKumar/Scrappy">
    <img src="https://img.shields.io/github/stars/KrinsKumar/Scrappy?style=social" alt="GitHub Stars">
  </a>
  <a href="https://github.com/KrinsKumar/Scrappy/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/KrinsKumar/Scrappy" alt="GitHub Contributors">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/github/license/KrinsKumar/Scrappy" alt="License">
  </a>
  <a href="https://github.com/KrinsKumar/Scrappy/issues">
    <img src="https://img.shields.io/github/issues/KrinsKumar/Scrappy" alt="GitHub Issues">
  </a>
</p>

## How to use scrappy

![](assets/scrappy-demo.gif)

1. Download the repo, using `npm i -g scrappy-cli`

2. You will need [groq](https://console.groq.com/) API key to convert from page to md. Once you obtain you key, run the following command to update the key in you system.

```
scrappy-cli --api-key <YOUR_API_KEY>
or
scrappy-cli --a <YOUR_API_KEY>
```

### Config - Optional

If you dont feel like passing the configs every time you run the command you can create a config file in the form of `toml` To set default options and arguments, you can create a `.scrappy.toml` file in your home directory `~/` with the following config options:

```
url = "some_url"
inputFile = "some_input_file"
outputFile = "some_output_file"
tokenUsage = true | false
stream = true | false
```

## Features

- **Input**: The main feature is that you can convert any website into a md, For this we will need a url of the page. You can provide a URL either using a file or command line arg.

  1. **URL using a file (default)**: Add the url in the file and pass the file location onto the command line. The file should contain one line that has the url of the page that you want to scrap.

  ```
  scrappy-cli files/input.txt
  ```

  2. **URL using command line arg**: Pass the url using the `-url` flag.

  ```
  scrappy-cli --url https://www.senecapolytechnic.ca/cgi-bin/subject?s1=OSD600
  or
  scrappy-cli -u https://www.senecapolytechnic.ca/cgi-bin/subject?s1=OSD600
  ```

- **Output**: The convert md can be stored in a preferred file if the file is passed using `-0` flag.

  1. **If the file is passed**: The final md will be stored in the output.md file in the files folder.

  ```
  scrappy-cli files/input.txt -0 files/
  or
  scrappy-cli files/input.txt --output files/output
  ```

  2. **The md is stored in the input file (default)**: A new md file will be created in the same folder of the input file with the updated md. In this case, a new file will be created `input.txt.md` in the same folder as the input.txt.

  ```
  scrappy-cli files/input.txt
  ```

  - **Token Usage**: When the program is run with the --token-usage/-t flag set, extra information will be reported to stderr about the number of tokens that were sent in the prompt and returned in the completion.
    `scrappy-cli files/input.txt --output files/output -t`
