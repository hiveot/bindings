# hiveot.bindings

This repository holds a collection of bindings for use with the HiveOT Hub.


## Overview

'WoT Things' are IoT devices and services that follow the W3C [Web of Things](https://www.w3.org/TR/wot-thing-description11/) standard. 

HiveOT aims to be WoT compatible. The primary means of interaction with IoT Things uses events and actions as described in the WoT TD document.

Hiveot bindings in this repository follow this standard to define and interact with IoT devices and services using the HiveOT Hub. 

These bindings fall into the following categories:
* Protocol bindings converts devices from 3rd party IoT protocols into 'WoT Things' on the HiveOT Hub.
  * for example: zwave, 1-wire, zigbee, coap, snmp, philips hue 
* User interface bindings provides a user interface to interact with Things using the Hub.
  * For example, web browser UI
* Gateway bindings provide access to HiveOT service APIs using a gateway protocol.
  * these bindings allow access to Thing directory, history, receive events and publish actions using standard network protocols.  
  * for example: mqtt, websockets, gRPC 
* Integration bindings intergrate with 3rd party services and creates WoT Things for the offered services.
  * for example: pihole, zoneminder, ifttt, weather services
* Thing bindings turns device hardware or local services into a WoT compatible Thing using pubsub of events and actions.
  * For example, pcmon

## Status

In development. Once the Hub reaches alpha more bindings will be added.

## Completed Bindings

none yet. It is still early days.

## Currently Being Worked On

* owserver 1-wire protocol binding

# Bindings For Future Consideration

### Protocol Bindings

* coap - binding to CoAP protocol
* hue - binding to philips hue lights
* isy99x - protocol binding for insteon devices using the isy99x gateway
  * Status: planned
* lorawan - binding to LoraWan protocol
* owserver - protocol binding for the 1-wire protocol via OWServer V2 gateway
  * Status: planning
* snmpscan  - scan network for snmp devices and report their status
  * various network device support
* zigbee - binding to zigbee devices
* zwave  - protocol binding for zwave USB stick controllers
  * Status: planned

### User Interface Bindings

* hiveoview - user interface binding for viewing hiveot devices in the web browser
  * Status: planning
* talk2action - talk to Thing actions
* event2speech - converts events into speech 

### Gateway Bindings

* mosquittogw - mqtt gateway using mosquitto
* wesocketgw - websocket gateway using node express
* grpcgw - gRPC gateway to services
* restgw - http REST api to hub services 

### Integration Bindings

* aurora watch - monitoring of space weather
* envirocan - environment canada weather integration
* weathernet - obtain weather forecast for location
* darksky - weather provider integration
* ifttt - if this then that integration
* ipcam - integration binding for ip camera control and image retrieval
  * Status: planned
* lightning - monitor lightning near location
* notify - send notifications over email, sms, voip
* pihole - pihole integration
* unifi - Ubiquity unifi device monitoring
* weatherbit - air quality monitor integration
* zm - zoneminder integration

### Thing Bindings

* devmon - run a PC monitor and report performance and resource usage on the device
* cping - monitor connectivity using ping where the target is a 'thing'
* loctrack - tracking of device locations through bluetooth, wifi and gps
