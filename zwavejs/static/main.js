const wasmPath = "./static/main.wasm"
const certsDir = "/home/henk/bin/hiveot/certs/"
const clientCertFile = certsDir+"zwavejsCert.pem"
let clientKeyFile = certsDir+"zwavejsKey.pem"
let caCertFile = certsDir+"caCert.pem"

"use strict";


// Assume add.wasm file exists that contains a single function adding 2 provided arguments
// const fs = require('fs');
require("../src/loadwasm.js")
// require("../static/wasm_exec_node.js")

globalThis.loadWasm(wasmPath).then((module)=>{
    console.log("Loading wasm complete")
})

// load the wasm file using the google provided script.
// This expects it as argv[2] which we don't like.
// FIXME 1: allow service commandline arguments instead of expecting wasm file path
// process.argv[2] = "./static/main.wasm"
// require("./wasm_exec_node.js")

const {json} = require("stream/consumers");
(global).WebSocket = require("ws");

const go = new globalThis.Go()



// global.handleRemoteCall = handleRemoteCall
// function handleRemoteCall() {
//     console.log("main.js handleRemoteCall called\n")
// }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function loadCerts(certsDir)  {

    let clientCertPem = fs.readFileSync(clientCertFile)
    let clientKeyPem = fs.readFileSync(clientKeyFile)
    let caCertPem = fs.readFileSync(caCertFile)

    return clientCertPem, clientKeyPem, caCertPem
}

async function main() {
    // need some time for wasm to be available
    // FIXME: load WASM from JS and wait until ready
    await sleep(300)


    let gwURL = "wss://127.0.0.1:8444"
    let clientCertPem, clientKeyPem, caCertPem = loadCerts()

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

    gostop()
    await sleep(300)
    console.log("time's up")

}

main()
