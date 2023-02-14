# ZwaveJS binding for HiveOT

This binding connects to a ZWave USB-Stick controller and publishes TD and events to the HiveOT message bus.

The objective is that this runs out of the box.


## Status

This binding is in development:
- The implementation of ZWave portion using the zwave-js library is largely complete.
- The capnp RPC library for nodejs is too finicky to use and doesn't run out of the box. This approach is shelved. 
- Connection with the hub pubsub will be implemented using go-capnp via wasm and websockets.



## HiveOT PubSub over WebSocket

This binding only needs the pubsub capability of the Hub. The Hub has a websocket gateway that proxies pubsub requests to the pubsub service (using capnproto).

While capnp serialization is desirable, the interface is so simple that a basic JSON serialization is good enough. 



## Installation

To run this binding this needs:
1. Nodejs to run the service
2. Client certificate generated using the Hub CLI

