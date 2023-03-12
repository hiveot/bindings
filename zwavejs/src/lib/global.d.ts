// TS definitions with Hub API global methods as provided by the wasm module

declare module globalThis {
    // wasm needs websocket access via globalThis
    // var WebSocket: any
}


declare global {
    // wasm needs websocket access via globalThis
    var WebSocket: any

    function onGoStarted();

    // var Go: any;
    // Connect to the Hub
    function connect(url: string, certpem: string, keypem: string, caCertPem: string);

    // Publish an event
    function pubEvent(thingID: string, eventID: string, value: any);

    // Subscribe to action requests
    function subActions(handler: (thingID: string, actionID: string, params: string) => void);

    function gostop();
}

export {}

// declare module globalThis {

// }