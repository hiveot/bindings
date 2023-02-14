const wasmPath = "./dist/hapi.wasm"

// CAREFUL! import ws as module first. (for use by wasm)
// Not this way: (global).WebSocket = import("ws");
// even though this works in commonjs: (global).WebSocket = require("ws");
import ws from "ws";
//@ts-ignore   // global.d.ts doesn't seem to be used...???
global.WebSocket = ws;

// import typescript files with js extension because node import fails without
// <rant>its 2022, why do we still have to deal with these idiosyncrasies?</rant>
import * as lw from "./startWasm.js";


// HubAPI is a convenience typescript wrapper around the golang wasm Hub connection API
export class HubAPI {
    constructor() {

    }

    // Initialize the Hub API
    // This loads the Hub Client WASM file and waits until it is ready for use
    async initialize() {
        await lw.startWasm(wasmPath)
        console.log("hapi initialized")
    }

    // Connect to the hub gateway
    // @param url: URL to connect to. "wss://host:port/ws"
    // @param certPem: client auth certificate in PEM format
    // @param keyPem: client key in PEM format
    // @param caCertPem: server CA certificate in PEM format
    async connect(url: string, certPem: string, keyPem: string, caCertPem: string) {
        return global.connect(url, certPem, keyPem, caCertPem)
    }

    // Publish a JSON encoded TD document
    async pubTD(thingID: string, deviceType: string, tdJSON: string) {
        return global.pubTD(thingID, deviceType, tdJSON)
    }

    // Publish a JSON encoded thing event
    async pubEvent(thingID: string, eventName: string, evJSON: string) {
        return global.pubEvent(thingID, eventName, evJSON)
    }

    // Disconnect from the gateway
    async disconnect() {

    }

}