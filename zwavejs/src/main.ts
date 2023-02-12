#!/usr/bin/env node


// load the wasm file using the google provided script.process.argv[2] = "./static/main.wasm"
import "./wasm_exec_node.js"
const go = new globalThis.Go()

import ZwaveBinding from "./binding"
import * as fs from "fs";
let binding = new ZwaveBinding();

async function main() {
  // need some time for wasm to be available
  // FIXME: load WASM from JS and wait until ready
  await sleep(300)
  const {connect:connect}=go.instance.exports

  let gwURL = "wss://127.0.0.1:8444"
  let certsDir = "/home/henk/bin/hiveot/certs/"
  let clientCertPem, clientKeyPem, caCertPem = loadCerts(certsDir)

  connect(gwURL, clientCertPem, clientKeyPem, caCertPem)
      .then(()=>{
        // console.log("logging in")
        // return login("bob", "jEi1JqEW")
      }).then(()=> {
    // console.log("publishing td")
    return pubTD("thingID1", "deviceType1", '{"id":"thing1","@type":"devicetype1"}')
  }).then(()=>{
    // console.log("publishing event")
    return pubEvent("thingID1", "eventName", '25')
  })
      .catch((e)=>{
        console.log("Startup failed: ",e)
        gostop()
      })

  await sleep(3000)

  // When the application gets a SIGINT or SIGTERM signal
  // Shutting down after SIGINT is optional, but the handler must exist
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      binding.stop();
    });
  }
  // binding.start("localhost:57575");
}


function loadCerts(certsDir: string): [string,string,string]  {

  let clientCertFile = certsDir+"zwavejsCert.pem"
  let clientKeyFile = certsDir+"zwavejsKey.pem"
  let caCertFile = certsDir+"caCert.pem"

  let clientCertPem = fs.readFileSync(clientCertFile)
  let clientKeyPem = fs.readFileSync(clientKeyFile)
  let caCertPem = fs.readFileSync(caCertFile)

  return [clientCertPem.toString(), clientKeyPem.toString(), caCertPem.toString()]
}


async function sleep(msec:number) {
  return new Promise(resolve => setTimeout(resolve, msec))
}

main()
