import "ws"
// const wasmPath = "./static/main.wasm"
const certsDir = "/home/henk/bin/hiveot/certs/"
const clientCertFile = certsDir + "zwavejsCert.pem"
let clientKeyFile = certsDir + "zwavejsKey.pem"
let caCertFile = certsDir + "caCert.pem"


// CAREFUL! import ws as module first. (for use by wasm)
// This is wrong: (global).WebSocket = import("ws");
// even though this works in commonjs: (global).WebSocket = require("ws");
import ws from "ws";
(global).WebSocket = ws;


const go = new globalThis.Go()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function loadCerts(certsDir) {

    let clientCertPem = fs.readFileSync(clientCertFile)
    let clientKeyPem = fs.readFileSync(clientKeyFile)
    let caCertPem = fs.readFileSync(caCertFile)

    return clientCertPem, clientKeyPem, caCertPem
}

// callback to invoke by golang when its methods are available
export function onGoStarted(args) {
    console.log("golang has started, continuing startup")
    let clientCertPem, clientKeyPem, caCertPem = loadCerts()
    startWS(clientCertPem, clientKeyPem, caCertPem)
}
global.onGoStarted = onGoStarted

export async function startWS(clientCertPem, clientKeyPem, caCertPem) {
    console.log("startup main")
    sleep(1000)
    let gwURL = "wss://127.0.0.1:8444"

    connect(gwURL, clientCertPem, clientKeyPem, caCertPem)
        .then(() => {
            // console.log("logging in")
            // return login("bob", "jEi1JqEW")
        }).then(() => {
            // console.log("publishing td")
            return pubTD("thingID1", "deviceType1", '{"id":"thing1","@type":"devicetype1"}')
        }).then(() => {
            // console.log("publishing event")
            return pubEvent("thingID1", "eventName", '25')
        })
        .catch((e) => {
            console.log("Startup failed: ", e)
            gostop()
        })

    await sleep(3000)

    gostop()
    await sleep(300)
    console.log("time's up")

}

// main()
