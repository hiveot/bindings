

import type {
  Driver, TranslatedValueID, ValueMetadataNumeric, ZWaveNode,
  ZWaveNodeValueNotificationArgs
} from "zwave-js";
import { getDeviceID, getPropName, parseNode } from "./parseNode.js";
// import { DevicePubSubImpl } from "./pubsub";
import type { ThingTD } from "./thing.js";
import { ValueMap } from "./valueMap.js";
import { ZWAPI } from "./zwapi.js";

// binding.ts holds the entry point to the zwave binding along with its configuration

// ZWaveBinding maps ZWave nodes to Thing TDs and events, and handles actions to control node inputs.
export class ZwaveBinding {
  id: string = "zwave";
  zwapi: ZWAPI;
  // the last received values for each node by nodeID
  lastValues = new Map<number, ValueMap>();
  // the last published values for each node by nodeID
  publishedValues = new Map<number, ValueMap>();
  // pubsub = new DevicePubSubImpl();

  constructor() {
    // zwapi hides the zwave specific details
    // TODO: Load binding config
    // TODO: create TD for binding instance and for the controller
    // TODO: Handle new discovered node and publish its TD
    // TODO: Handle updates to node values and publish events
    // TODO: receive actions and control node configuration or inputs
    this.zwapi = new ZWAPI(
      this.handleNodeUpdate.bind(this),
      this.handleValueUpdate.bind(this),
    );
  }

  // Handle discovery or update of a node and publish its TD event
  // This establishes the first value map to update with handleValueUpdate events
  handleNodeUpdate(node: ZWaveNode) {
    console.log("handleNodeUpdate:node:", node.id);
    let thingTD = parseNode(this.zwapi, node);
    this.publishTD(node.id, thingTD);

    let valueMap = new ValueMap(node);
    this.lastValues.set(node.id, valueMap);
    this.publishProperties(node.id, valueMap)
  }

  // Handle update of a node's value. 
  // @param node: The node whos values have updated
  // @param valueMap: map of values that are updating. This can include values that haven't changed.
  handleValueUpdate(node: ZWaveNode, vid: TranslatedValueID, newValue: any) {
    let newValueName = newValue
    // submit the value or its name?
    // use value. translation to name using enum is a UI job
    // let vidMeta = node.getValueMetadata(vid)
    // if (vidMeta.type == "number") {
    //   let vmNumeric = vidMeta as ValueMetadataNumeric
    //   if (vmNumeric.states) {
    //     newValueName = vmNumeric.states[newValue]
    //   }
    // }

    let propName = getPropName(vid)
    let valueMap = this.lastValues.get(node.id);
    // update the map of recent values
    let lastValue = valueMap?.get(propName)
    if (lastValue !== newValue) {
      valueMap?.set(propName, newValue)
      this.publishEvent(node.id, propName, newValueName)
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
    console.log("publishTD: nodeID=", nodeID, ":", tdJSON)
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
