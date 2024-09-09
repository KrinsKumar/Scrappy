#!/usr/bin/env node
import fs from "fs";
import { validateArgs, getUrlBody, convertIntoMd, saveMd } from "./helper.js";

// Check if both input and output file names are provided
let state = validateArgs(process.argv);
if (!state) {
  process.exit(1);
}

// add emogi
process.stdout.write("Validations complete ✅\n");

// get the url of the website
let url = state.isInputFile
  ? fs.readFileSync(state.inputFile, "utf8").trim()
  : state.url;

// get the body of the url
process.stdout.write("Getting the body from the url : " + url + " ");
const body = await getUrlBody(url);
process.stdout.write("Body fetched successfully ✅\n");

// convert the body into md
process.stdout.write("Converting the body into markdown... ");
const md = await convertIntoMd(body);
process.stdout.write("\nConversion complete ✅\n");

// save the md into the output file
saveMd(md);
