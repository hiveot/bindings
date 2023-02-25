

import type {  TranslatedValueID, ZWaveNode } from "zwave-js";
import type { HubAPI } from "../lib/hubapi.js";
import {EventNameAlive, EventNameInclusion, getPropID, parseNode} from "./parseNode.js";
import type { ThingTD } from "../lib/thing.js";
import { ValueMap } from "./valueMap.js";
import { ZWAPI } from "./zwapi.js";
import {parseController} from "./parseController.js";

// binding.ts holds the entry point to the zwave binding along with its configuration

// ZWaveBinding maps ZWave nodes to Thing TDs and events, and handles actions to control node inputs.
export class ZwaveBinding {
  id: string = "zwave";
  hapi: HubAPI;
  zwapi: ZWAPI;
  // the last received values for each node by nodeID
  lastValues = new Map<number, ValueMap>();
  // the last published values for each node by nodeID
  publishedValues = new Map<number, ValueMap>();
  // pubsub = new DevicePubSubImpl();

  constructor(hapi: HubAPI) {
    this.hapi = hapi;
    // zwapi hides the zwave specific details
    // TODO: Load binding config
    // TODO: create TD for binding instance and for the controller
    // TODO: Handle new discovered node and publish its TD
    // TODO: Handle updates to node values and publish events
    // TODO: receive actions and control node configuration or inputs
    this.zwapi = new ZWAPI(
      this.handleNodeUpdate.bind(this),
      this.handleValueUpdate.bind(this),
      this.handleNodeStateUpdate.bind(this),
    );
  }

  // Handle update of one of the node state flags
  // This emits a corresponding event
  handleNodeStateUpdate(node: ZWaveNode, newState: string) {
    let thingID = this.zwapi.getDeviceID(node.id)

    // NOTE: the names of these events and state MUST match those in the TD event enum. See parseNode.
    switch(newState) {
      case "alive":
      case "dead":
      case "awake":
      case "sleeping": {
        this.hapi.pubEvent(thingID, EventNameAlive, newState)
      } break;
      case "interview completed":
      case "interview failed":
      case "interview started": {
        this.hapi.pubEvent(thingID, EventNameInclusion, newState)
      } break;
    }
  }
    // Handle discovery or update of a node and publish its TD event
  // This establishes the first value map to update with handleValueUpdate events
  handleNodeUpdate(node: ZWaveNode) {
    console.log("handleNodeUpdate:node:", node.id);
    let thingTD = parseNode(this.zwapi, node);
    if (node.isControllerNode) {
        parseController(thingTD, this.zwapi.driver.controller)
      }

    this.publishTD(node.id, thingTD);

    let valueMap = new ValueMap(node);
    this.lastValues.set(node.id, valueMap);
    this.publishProperties(node.id, valueMap)
  }

  // Handle update of a node's value. 
  // @param node: The node whos values have updated
  // @param vid: zwave value id
  // @param newValue: the updated value
  handleValueUpdate(node: ZWaveNode, vid: TranslatedValueID, newValue: any) {
    // submit the value or its name?
    // use value. translation to name using enum is a UI job
    let vidMeta = node.getValueMetadata(vid)
    // if (vidMeta.type == "number") {
    //   let vmNumeric = vidMeta as ValueMetadataNumeric
    //   if (vmNumeric.states) {
    //     newValueName = vmNumeric.states[newValue]
    //   }
    // }

    let propID = getPropID(vid, vidMeta)
    let valueMap = this.lastValues.get(node.id);
    // update the map of recent values
    let lastValue = valueMap?.get(propID)
    if (lastValue !== newValue) {
      valueMap?.set(propID, newValue)
      this.publishEvent(node.id, propID, newValue)
    }
  }

  // periodically publish the properties that have updated
  publishPropertyUpdates() {
    for (let [nodeID, valueMap] of this.lastValues) {
      let node = this.zwapi.getNode(nodeID)
      if (node) {
        let publishedValues = this.publishedValues.get(nodeID)
        let diffValues = publishedValues ? valueMap.diffValues(publishedValues) : valueMap;
        if (diffValues.size > 0) {
          this.publishProperties(nodeID, diffValues);
        }
      } else {
        // node no longer exist. Remove it.
        this.lastValues.delete(nodeID)
      }
    }
  }

  // Publish event
  publishEvent(nodeID: number, eventName: string, eventDoc: any) {
    let evJSON = JSON.stringify(eventDoc, null, " ")
    let thingID = this.zwapi.getDeviceID(nodeID)
    this.hapi.pubEvent(thingID, eventName, evJSON)
    console.info(`* Publishing event ${eventName} for node ${nodeID}: ${evJSON}`)
  }

  // Publish node properties
  publishProperties(nodeID: number, valueMap: ValueMap) {
    // this.hivePubSub.Publish(deviceID, valueMap)
    let valueJSON = JSON.stringify(valueMap, null, " ")
    console.log("* Publishing properties event for node", nodeID, ":", valueJSON)
  }

  // publish a TD document
  publishTD(nodeID: number, td: ThingTD) {
    let tdJSON = JSON.stringify(td, null, " ")
    let thingID = this.zwapi.getDeviceID(nodeID)
    this.hapi.pubTD(thingID, td["@type"], tdJSON)
    console.log("publishTD: nodeID=", nodeID)
  }

  //

  // Starts and run the binding. This does not return until Stop is called.
  async start(address: string) {
    console.log("startup");
    // this.pubsub.connect(address)
    await this.zwapi.connect();
  }

  // Stop the binding and disconnect from the ZWave controller
  async stop() {
    console.log("Shutting Down...");
    await this.zwapi.disconnect();
    // this.pubsub.disconnect()
    process.exit(0);
  }
}
