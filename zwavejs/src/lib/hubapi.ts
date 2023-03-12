// CAREFUL! import ws as module first. (for use by wasm)
// Not this way: (global).WebSocket = import("ws");
// even though this works in commonjs: (global).WebSocket = require("ws");
import ws from "ws";
// import typescript files with js extension because node import fails without
// <rant>its 2022, why do we still have to deal with these idiosyncrasies?</rant>
import * as lw from "./startWasm.js";
import {EventTypes} from "./vocabulary.js";
import type {ThingTD} from "./thing.js";

const wasmPath = "./build/hapi.wasm"

//@ts-ignore   // global.d.ts doesn't seem to be used...???
global.WebSocket = ws;

// HubAPI is a convenience typescript wrapper around the golang wasm Hub connection API
export class HubAPI {
    isConnected: boolean = false;

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
        await global.connect(url, certPem, keyPem, caCertPem)
        this.isConnected = true
    }


    // Publish a JSON encoded thing event
    pubEvent(thingID: string, eventName: string, evJSON: string) {
        if (this.isConnected) {
            // defined in global.d.ts
            global.pubEvent(thingID, eventName, evJSON)
        }
        return
    }


    // Publish a Thing property map
    // Ignored if props map is empty
    pubProperties(thingID: string, props: { [key: string]: any }) {
        // if (length(props.) > 0) {
        let propsJSON = JSON.stringify(props, null, " ")
        if (propsJSON.length > 2) {
            this.pubEvent(thingID, EventTypes.Properties, propsJSON)
        }
    }

    // Publish a Thing TD document
    pubTD(thingID: string, td: ThingTD) {
        let tdJSON = JSON.stringify(td, null, " ")
        this.pubEvent(thingID, EventTypes.TD, tdJSON)
    }

    // Subscribe to actions for things managed by this publisher.
    //
    // The 'actionID' is the key of the action in the TD action map,
    // or the hubapi.ActionNameConfiguration action which carries configuration key-value pairs.
    //
    // Authorization is handled by the message bus and not a concern of the service/device.
    //
    // Subscription requires a connection with the Hub. If the connection fails it must be
    // renewed.
    //
    // @param handler: handler of the action request, where:
    //  thingID: ID of the thing whose action is requested
    //  actionID: ID of the action requested as defined in the TD
    //  data: serialized event data
    subActions(handler: (thingID: string, actionID: string, data: string) => void) {

        if (this.isConnected) {
            // defined in global.d.ts
            global.subActions(handler)
        }
        return
    }

    // Disconnect from the gateway
    async disconnect() {

    }

}