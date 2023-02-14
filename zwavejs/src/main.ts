#!/usr/bin/env node
import "./hubapi.js";

const certsDir = "/home/henk/bin/hiveot/certs/"
const gwURL = "wss://127.0.0.1:8444"


function loadCerts(certsDir: string): [clientCertPem: string, clientKeyPem: string, caCertPem: string] {

  let clientCertFile = certsDir + "zwavejsCert.pem"
  let clientKeyFile = certsDir + "zwavejsKey.pem"
  let caCertFile = certsDir + "caCert.pem"

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


//--- Step 2: test publications
hapi.pubTD("thingID1", "deviceType1", '{"id":"thing1","@type":"devicetype1"}')
hapi.pubEvent("thingID1", "eventName", '25');


//--- Step 3: Start the zwave-js binding  

import { ZwaveBinding } from "./binding.js"
import * as fs from "fs";
import { HubAPI } from "./hubapi.js";
let binding = new ZwaveBinding();
// binding.start("localhost:57575");


// When the application gets a SIGINT or SIGTERM signal
// Shutting down after SIGINT is optional, but the handler must exist
console.log("Ready. Waiting for signal to terminate")
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    binding.stop();
  });
}

