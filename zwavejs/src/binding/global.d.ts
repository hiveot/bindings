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
    function pubEvent(thingID: string, eventName: string, evJSON: string);
    function gostop();
}

export { }

// declare module globalThis {

// }