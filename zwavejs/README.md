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

While capnp serialization and rpc is desirable, the nodejs tools for this are old and difficult to work with. Instead, the Golang capnp client, compiled to wasm, is used to publish and subscribe.  

## Build

This needs:
* golang v1.18+
* typescript 4.9.5  (npm install -g typescript)
* yarn
* nodejs v18+
* typescript compiler v4.9+ (tsc, included in snap's node)
* make tools

## Installation 

This installs as a binary package in the ~/bin/hiveot/bin/bindings directory

## Run

To run this binding this needs:
1. Nodejs v18+ to run the service
2. Client certificate generated using the Hub CLI



# Mapping ZWave to HiveOT

ZWaveJS uses 'Value IDs', containing command class, propertyName and propertyKey and CC metadata to define type and capabilities of IoT devices. HiveOT uses the WoT TD standard to describe IoT devices using properties (attributes and configuration), actions (inputs) and events (outputs). How are value IDs mapped to the WoT TD?

## Mapping of Value ID to property, event and action IDs

The TD contains three maps, properties, events and actions. The keys of these maps are unique property instance IDs that are used when sending events and receiving actions. These IDs are not for humans but must be immutable within the device. 

The property ID is constructed from: VID propertyName + propertyKey + endpoint, where propertyKey is only used when it is defined, and endpoint is only used when multiple instances exist.

## Mapping of Value ID to Property, Event or Action

ZWave Command Classes are used to determine if a VID is a property, action or event.
CC's for actuator devices are actions, while CC's for data reporting devices are events. The remainder are properties. 

## Mapping of Vocabulary

Information is easiest consumed if the terminology used is consistent among various data sources.

Different technologies and device manufacturers however can use different terminology to indicate the same thing. Some might use 'temp', 'temperature' or 'degrees' for example. HiveOT attempts to adhere to a common ontology, but this seems to be a rather complex topic. See for example W3C's sematic sensor network ontology : https://www.w3.org/TR/vocab-ssn/#intro. Without a well known common vocabulary for IoT data, HiveOT vocabulary is based on terminology used in ZWave, Zigbee, Ocap, and other automation solutions. Units are based on SI metric units. 

HiveOT defines its vocabulary in a capnp file that can be compiled to various programming languages. This vocabulary is based on commonly used terminology and not limited to one specific ontology. Each binding must map the names used in their specific technology to this vocabulary. This binding uses a versioned vocabulary table that can easily be updated and corrected. The table version matches the capnp defined vocabulary version. Note that this vocabulary is intended for machine use to simplify interpretation and usage by services.



## Property, Event and Action Keys

In the TD, properties, actions and events are mapped by key. The key represents the instance of the property, event or action, is not intended for human presentation and has to be unique. 

The key is based on the property type. If multiple instances are possible, the instance identifier is appended. For example 'scene 001', which in ZWaveJS VID is defined as propertyName 'scene' and propertyKey "001". If the propertyKey is undefined, a single instance is assumed and the property type (@type field) is used as key.


## Title and Description

The WoT TD supports language translatable names for each property, event and action. The 'title' and 'description' fields are intended to be read by humans.

The ZWaveJS VID metadata 'label' field is used as the 'title' while the and optional a 'description' field is used as the 'description'. If no description is available, the Command Class name and label are used as description.  


