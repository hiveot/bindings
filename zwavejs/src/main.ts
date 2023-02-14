#!/usr/bin/env node

// HiveOT zwave driver main entry
const wasmPath = "./dist/main.wasm"
const certsDir = "/home/henk/bin/hiveot/certs/"
// let clientCertFile = certsDir + "zwavejsCert.pem"
// let clientKeyFile = certsDir + "zwavejsKey.pem"
// let caCertFile = certsDir + "caCert.pem"



//--- Step 1: Load wasm hiveot API 

// import typescript files with js extension because node import fails without
// <rant>its 2022, why do we still have to deal with these incompatibilities?</rant>
import * as lw from "./loadwasm.js";
await lw.loadWasm(wasmPath)
sleep(1000)
console.log("Loading wasm complete")

//--- Step 2: Load certificates and websockets 

// CAREFUL! import ws as module first. (for use by wasm)
// Not this way: (global).WebSocket = import("ws");
// even though this works in commonjs: (global).WebSocket = require("ws");
import ws from "ws";
// (global).WebSocket = ws;

// export function onGoStarted() {
//   console.log("golang has started, continuing startup")
//   let clientCertPem, clientKeyPem, caCertPem = loadCerts(certsDir)
//   startWS(clientCertPem, clientKeyPem, caCertPem)
// }
// global.onGoStarted = onGoStarted
sleep(1000)
await import("./startup.js");
sleep(1000)

// import { startWS } from "./startup.js"
sleep(1000)

let clientCertPem, clientKeyPem, caCertPem = loadCerts(certsDir)
// await startWS(clientCertPem, clientKeyPem, caCertPem)

//--- Step 3: Launch wasm hiveot client using certificates

//--- Step 4: Launch the zwave-js binding app 









//--- start zwave binding
//-----------



// load the wasm file using the google provided script.process.argv[2] = "./static/main.wasm"
import { ZwaveBinding } from "./binding.js"
import * as fs from "fs";
let binding = new ZwaveBinding();

async function main() {
  // const { connect: connect } = go.instance.exports

  let gwURL = "wss://127.0.0.1:8444"
  let certsDir = "/home/henk/bin/hiveot/certs/"
  let clientCertPem, clientKeyPem, caCertPem = loadCerts(certsDir)


  // connect(gwURL, clientCertPem, clientKeyPem, caCertPem)
  //   .then(() => {
  //     // console.log("logging in")
  //     // return login("bob", "jEi1JqEW")
  //   }).then(() => {
  //     // console.log("publishing td")
  //     return pubTD("thingID1", "deviceType1", '{"id":"thing1","@type":"devicetype1"}')
  //   }).then(() => {
  //     // console.log("publishing event")
  //     return pubEvent("thingID1", "eventName", '25')
  //   })
  //   .catch((e) => {
  //     console.log("Startup failed: ", e)
  //     gostop()
  //   })

  // await sleep(3000)

  // When the application gets a SIGINT or SIGTERM signal
  // Shutting down after SIGINT is optional, but the handler must exist
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      binding.stop();
    });
  }
  // binding.start("localhost:57575");
}


function loadCerts(certsDir: string): [string, string, string] {

  let clientCertFile = certsDir + "zwavejsCert.pem"
  let clientKeyFile = certsDir + "zwavejsKey.pem"
  let caCertFile = certsDir + "caCert.pem"

  let clientCertPem = fs.readFileSync(clientCertFile)
  let clientKeyPem = fs.readFileSync(clientKeyFile)
  let caCertPem = fs.readFileSync(caCertFile)

  return [clientCertPem.toString(), clientKeyPem.toString(), caCertPem.toString()]
}


async function sleep(msec: number) {
  return new Promise(resolve => setTimeout(resolve, msec))
}

main()
