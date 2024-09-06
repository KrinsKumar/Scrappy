#!/usr/bin/env node
import fs from "fs";
import { validateArgs, getUrlBody, convertIntoMd, saveMd } from "./helper.js";

console.log("Hello");
console.log("Validating the arguments...");

// Check if both input and output file names are provided
let state = validateArgs(process.argv);

// add emogi
console.log("Validations complete ✅");

// get the url of the website
let url = state.isInputFile
  ? fs.readFileSync(state.inputFile, "utf8").trim()
  : state.url;

// get the body of the url
console.log("Getting the body from the url : " + url);
const body = await getUrlBody(url);
console.log("Body fetched successfully ✅");

// convert the body into md
console.log("Converting the body into markdown...");
const md = await convertIntoMd(body);
console.log("Conversion complete ✅");

// save the md into the output file
saveMd(md);
