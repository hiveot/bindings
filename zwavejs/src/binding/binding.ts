import type {TranslatedValueID, ZWaveNode} from "zwave-js";
import type {HubAPI} from "../lib/hubapi.js";
import {parseNode} from "./parseNode.js";
import type {ThingTD} from "../lib/thing.js";
import {ParseValues} from "./parseValues.js";
import {ZWAPI} from "./zwapi.js";
import {parseController} from "./parseController.js";
import {logVid} from "./logvid.js";
import {getPropID} from "./getPropID.js";
import {EventTypes} from "../lib/vocabulary.js";

// binding.ts holds the entry point to the zwave binding along with its configuration

// ZWaveBinding maps ZWave nodes to Thing TDs and events, and handles actions to control node inputs.
// TODO: Load binding config
// TODO: handle actions
// TODO: handle configuration
export class ZwaveBinding {
    id: string = "zwave";
    hapi: HubAPI;
    zwapi: ZWAPI;
    // the last received values for each node by deviceID
    lastValues = new Map<string, ParseValues>(); // nodeId: ValueMap
    // the last published values for each node by deviceID
    publishedValues = new Map<string, ParseValues>();
    vidLogFile: string | undefined
    vidLogFD: number | undefined
    // only publish events when a value has changed
    publishOnlyChanges: boolean = false


    // @param hapi: connectd Hub API to publish and subscribe
    // @param vidLogFile: optional csv file to write discovered VID and metadata records
    constructor(hapi: HubAPI, vidLogFile?: string) {
        this.hapi = hapi;
        // zwapi handles the zwavejs specific details
        this.zwapi = new ZWAPI(
            this.handleNodeUpdate.bind(this),
            this.handleValueUpdate.bind(this),
            this.handleNodeStateUpdate.bind(this),
        );
        this.vidLogFile = vidLogFile
    }

    // Handle update of one of the node state flags
    // This emits a corresponding event
    handleNodeStateUpdate(node: ZWaveNode, newState: string) {
        let thingID = this.zwapi.getDeviceID(node.id)

        // NOTE: the names of these events and state MUST match those in the TD event enum. See parseNode.
        switch (newState) {
            case "alive":
            case "dead":
            case "awake":
            case "sleeping": {
                this.hapi.pubEvent(thingID, EventTypes.Status, newState).then()
            }
                break;
            case "interview completed":
            case "interview failed":
            case "interview started": {
                this.hapi.pubEvent(thingID, "interview", newState).then()
            }
                break;
        }
    }

    // Handle discovery or update of a node and publish its TD event
    // This establishes the first value map to update with handleValueUpdate events
    handleNodeUpdate(node: ZWaveNode) {
        console.log("handleNodeUpdate:node:", node.id);
        let thingTD = parseNode(this.zwapi, node, this.vidLogFD);

        if (node.isControllerNode) {
            parseController(thingTD, this.zwapi.driver.controller)
        }

        this.publishTD(thingTD.id, thingTD);

        let valueMap = new ParseValues(node);
        this.lastValues.set(thingTD.id, valueMap);
        this.publishProperties(thingTD.id, valueMap)
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
        let deviceID = this.zwapi.getDeviceID(node.id)
        let propID = getPropID(vid)
        let valueMap = this.lastValues.get(deviceID);
        // update the map of recent values
        let lastValue = valueMap?.get(propID)
        if (lastValue !== newValue || !this.publishOnlyChanges) {
            valueMap?.set(propID, newValue)
            this.publishEvent(deviceID, propID, newValue)
        }
    }

    // periodically publish the properties that have updated
    publishPropertyUpdates() {
        for (let [deviceID, valueMap] of this.lastValues) {
            let node = this.zwapi.getNodeByDeviceID(deviceID)
            if (node) {
                let publishedValues = this.publishedValues.get(deviceID)
                let diffValues = publishedValues ? valueMap.diffValues(publishedValues) : valueMap;
                if (diffValues.size > 0) {
                    this.publishProperties(deviceID, diffValues);
                }
            } else {
                // node no longer exist. Remove it.
                this.lastValues.delete(deviceID)
            }
        }
    }

    // Publish event
    publishEvent(thingID: string, eventName: string, eventDoc: any) {
        let evJSON = JSON.stringify(eventDoc, null, " ")
        this.hapi.pubEvent(thingID, eventName, evJSON).then()
        console.info(`* Publishing event ${eventName} for device ${thingID}: ${evJSON}`)
    }

    // Publish node properties
    publishProperties(thingID: string, valueMap: ParseValues) {
        // this.hivePubSub.Publish(deviceID, valueMap)
        let valueJSON = JSON.stringify(valueMap, null, " ")
        console.log("* Publishing properties event for thing", thingID, ":", valueJSON)
        this.hapi.pubProperties(thingID, valueMap)
    }

    // publish a TD document
    publishTD(thingID: string, td: ThingTD) {
        let tdJSON = JSON.stringify(td, null, " ")
        console.log("* Publishing TD: nodeID=", thingID)
        this.hapi.pubTD(thingID, td["@type"], tdJSON).then()
    }

    // subscribe to actions
    async subActions() {
        await this.hapi.subActions(
            (thingID: string, actionID: string, params: string) => {
                let node = this.zwapi.getNodeByDeviceID(thingID)
                if (node == undefined) {
                    console.error("subActions: unable to find node for thingID", thingID)
                    return
                }
                // TODO: keep a map of propID to vid's
                for (let vid of node.getDefinedValueIDs()) {
                    let propID = getPropID(vid)
                    if (propID == actionID) {
                        this.zwapi.setValue(node, vid, params)
                        break;
                    }
                }
            })
    }

    // Starts and run the binding. This does not return until Stop is called.
    // address of the Hub API.
    async start() {
        console.log("startup");

        // optional logging of discovered VID
        if (this.vidLogFile) {
            this.vidLogFD = fs.openSync(this.vidLogFile, "w+", 0o640)
            logVid(this.vidLogFD)
        }
        this.subActions()
        // await this.hapi.subConfig(this.handleConfig)
        await this.zwapi.connect();
    }

    // Stop the binding and disconnect from the ZWave controller
    async stop() {
        console.log("Shutting Down...");
        await this.zwapi.disconnect();
        if (this.vidLogFD) {
            fs.close(this.vidLogFD)
        }
        process.exit(0);
    }
}
