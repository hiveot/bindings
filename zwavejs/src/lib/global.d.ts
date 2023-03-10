declare module globalThis {
    // wasm needs websocket access via globalThis
    // var WebSocket: any
}


declare global {
    // wasm needs websocket access via globalThis
    var WebSocket: any

    function onGoStarted();

    // var Go: any;
    function connect(url: string, certpem: string, keypem: string, caCertPem: string);

    function pubTD(thingID: string, deviceType: string, tdJSON: string);

    function pubEvent(thingID: string, eventID: string, evJSON: string);

    function pubProperties(thingID: string, props: Map<string, any>);

    function subActions(handler: (thingID: string, actionID: string, params: string) => void);

    function gostop();
}

export {}

// declare module globalThis {

// }