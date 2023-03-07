#!/usr/bin/env node
import "../lib/hubapi.js";
import path from "path";
import { HubAPI } from "../lib/hubapi.js";

// commandline args: main certsDir gwURL
const defaultCertsDir = "./certs/"
const defaultURL = "wss://127.0.0.1:8444"
const defaultLogsDir = "./logs"

let appPath = ""
let appDir = ""
let logsDir = ""
let certsDir = defaultCertsDir
let gwURL = defaultURL
let zwInfoFile: string | undefined

if (process.argv.length > 1) {
  appPath = process.argv[1]
  appDir = path.dirname(appPath)
  certsDir = path.join(appDir, defaultCertsDir)
  logsDir = path.join(appDir, defaultLogsDir)
  zwInfoFile = path.join(logsDir, "zwInfo.csv")
}
if (process.argv.length > 2) {
  appDir = process.argv[2]
  certsDir = path.join(appDir, defaultCertsDir)
  logsDir = path.join(appDir, defaultLogsDir)
  zwInfoFile = path.join(logsDir, "zwInfo.csv")
}
if (process.argv.length > 3) {
  gwURL = process.argv[3]
}

console.log("binding startup. certsDir=" + certsDir + ", connecting to: ", gwURL)


function loadCerts(certsDir: string): [clientCertPem: string, clientKeyPem: string, caCertPem: string] {

  let clientCertFile = certsDir + "/zwavejsCert.pem"
  let clientKeyFile = certsDir + "/zwavejsKey.pem"
  let caCertFile = certsDir + "/caCert.pem"

  let clientCertPem = fs.readFileSync(clientCertFile)
  let clientKeyPem = fs.readFileSync(clientKeyFile)
  let caCertPem = fs.readFileSync(caCertFile)

  return [clientCertPem.toString(), clientKeyPem.toString(), caCertPem.toString()]
}

//--- Step 1: Initialize the Hub connection
var hapi = new HubAPI()

await hapi.initialize()
let [clientCertPem, clientKeyPem, caCertPem] = loadCerts(certsDir)
await hapi.connect(gwURL, clientCertPem, clientKeyPem, caCertPem)

//--- Step 2: Start the zwave-js binding  

import { ZwaveBinding } from "./binding.js"
import * as fs from "fs";
import { exit } from "process";
let binding = new ZwaveBinding(hapi, zwInfoFile);
await binding.start();


// When the application gets a SIGINT or SIGTERM signal
// Shutting down after SIGINT is optional, but the handler must exist
console.log("Ready. Waiting for signal to terminate")
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    gostop();
    binding.stop();
    exit(0);
  });
}

