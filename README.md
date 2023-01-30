# HiveOT Bindings

This repository holds a collection of bindings for use with the HiveOT Hub.


## Overview

'WoT Things' are IoT devices and services that follow the W3C [Web of Things](https://www.w3.org/TR/wot-thing-description11/) standard. 

HiveOT aims to be WoT compatible. The primary means of interaction with IoT Things uses events and actions as described in the WoT TD document.

Hiveot bindings in this repository follow this standard to define and interact with IoT devices and services using the HiveOT Hub. 


## Status

This binding is functional but breaking changes can still be expected.


### IoT Protocol Bindings

IoT protocol bindings converts devices from 3rd party IoT protocols into 'WoT Things' on the HiveOT Hub.

| name     | description                                    | status                                       |
|----------|------------------------------------------------|----------------------------------------------|
| coap     | CoAP device support on the local network       | <span style="color:red">todo</span>          |
| isy99x   | Insteon protocol adapter using isy99 gateway   | <span style="color:orange">planned</span>       |
| lora     | LoRa Protocol binding for LoRa gateway         | <span style="color:red">todo</span>          |
| owserver | 1-wire support through the OWServer-V2 gateway | <span style="color:yellow">alpha</span> |
| phue     | Philips Hue protocol adapter                   | <span style="color:red">todo</span>          |
| snmp     | Scan network for snmp devices                  | <span style="color:red">todo</span>          |
| zigbee   | binding to zigbee devices                      | <span style="color:red">todo</span>          |
| zwaveusb | ZWave support using USB controller             | <span style="color:red">todo</span>          |

### User Interface Bindings

User interface bindings provides a user interface to interact with Things using the Hub.

| name        | description                                 | status                                 |
|-------------|---------------------------------------------|----------------------------------------|
| hiveoview   | view hiveot devices in the web browser      | <span style="color:orange">planned</span> |
| talk2action | talk to Thing actions                       | <span style="color:red">todo</span>    |
| larynx      | converts events into speech                 | <span style="color:red">todo</span>    |
| mimic3      | converts events into speech using MycroftAI | <span style="color:red">todo</span>    |

### Gateway Bindings

Gateway bindings provide access to HiveOT service APIs using a gateway protocol. these bindings allow access to Thing directory, history, receive events and publish actions using standard network protocols.

| name        | description                         | status                                  |
|-------------|-------------------------------------|-----------------------------------------|
| gateway     | API gateway using capnp (default)   | <span style="color:yellow">alpha</span> |
| mosquittogw | mqtt gateway using mosquitto        | <span style="color:red">todo</span>     |
| websocketgw | websocket gateway for notifications | <span style="color:red">todo</span>     |
| grpcgw      | gRPC gateway to services            | <span style="color:red">todo</span>     |
| restgw      | http REST api to hub services       | <span style="color:red">planned</span>  |

### Integration Bindings

Integration bindings intergrate with 3rd party services and devices, and creates WoT Things for the offered services.

| name         | description                                       | status                                    |
|--------------|---------------------------------------------------|-------------------------------------------|
| aurora watch   | monitoring of space weather                     | <span style="color:red">todo</span>       |
| envirocan      | environment canada weather integration          | <span style="color:orange">planned</span> |
| darksky        | weather provider integration                    | <span style="color:red">todo</span>       |
| ifttt          | 'if this then that' service integration         | <span style="color:red">todo</span>       |
| lightning      | monitor lightning near location                 | <span style="color:red">todo</span>       |
| notify         | send and receive notifications over email, sms, | <span style="color:red">todo</span>       |
| openweathermap | weather provider integration                    | <span style="color:orange">planned</span> |
| pihole         | pihole integration                              | <span style="color:red">todo</span>       |
| unifi          | Ubiquity unifi device monitoring                | <span style="color:red">todo</span>       |
| weatherbit     | air quality monitor integration                 | <span style="color:red">todo</span>       |
| weathernet     | obtain weather forecast for location            | <span style="color:red">todo</span>       |
| zm             | zoneminder integration                          | <span style="color:red">todo</span>       |

### Thing Bindings

Thing bindings are embedded in a device or service and turns these into WoT compatible Things. 

| name     | description                                                   | status                                    |
|----------|---------------------------------------------------------------|-------------------------------------------|
| automate | rule based automation                                         | <span style="color:red">todo</span>       |
| cping    | monitor connectivity using ping where the target is a 'thing' | <span style="color:red">todo</span>       |
| ipcam    | IP camera control and image retrieval                         | <span style="color:orange">planned</span> |
| wallpaper| Dynamic wallpaper from IP camera images                       | <span style="color:orange">planned</span> |
| locator  | tracking of device locations through bluetooth, wifi and gps  | <span style="color:red">todo</span>       |
| monit    | run Monitor the status of a computer                          | <span style="color:red">todo</span>       |
