import {
    NodeStatus,
    NodeType,
    TranslatedValueID,
    ValueMetadataBoolean,
    ValueMetadataNumeric,
    ValueMetadataString,
    ZWaveNode,
    ZWavePlusNodeType,
    ZWavePlusRoleType
} from "zwave-js";
import {CommandClasses, InterviewStage} from '@zwave-js/core';
import {ActionAffordance, EventAffordance, PropertyAffordance, ThingTD} from "../lib/thing.js";
import {ActionTypes, DataType, EventTypes, PropTypes} from "../lib/vocabulary.js";
import type {ZWAPI} from "./zwapi.js";
import {logVid} from "./logvid.js";
import {getPropID} from "./getPropID.js";
import {getVidAffordance, VidAffordance} from "./getVidAffordance.js";
import {getDeviceType} from "./getDeviceType.js";
import {DataSchema} from "../lib/dataSchema.js";


// Add the zwave value data to the TD as an action
function addAction(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, actionID: string, va: VidAffordance): ActionAffordance {
    // let vidMeta = node.getValueMetadata(vid)

    // actions without input have no schema. How to identify these?
    let schema = new DataSchema()
    SetDataSchema(schema, node, vid)
    let action = td.AddAction(actionID, va.atType,
        schema.title || actionID, schema.description, schema)

    if (action.input) {
        // The VID title, description belongs to the action, not the schema
        action.input.title = undefined
        action.input.description = undefined
        action.input.readOnly = false
    }
    return action
}

// Add the zwave value data to the TD as an attribute property
function addAttribute(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, propID: string, va: VidAffordance): PropertyAffordance {

    let prop = td.AddProperty(propID, va?.atType, "", DataType.Unknown)
    // SetDataSchema also sets the title and data type
    SetDataSchema(prop, node, vid)
    return prop
}

// Add the zwave VID to the TD as a configuration property
function addConfig(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, propID: string, va: VidAffordance): PropertyAffordance {
    let prop = td.AddProperty(propID, va.atType, "", DataType.Unknown)
    prop.readOnly = false
    // SetDataSchema also sets the title and data type
    SetDataSchema(prop, node, vid)

    return prop

}

// Add the zwave VID to the TD as an event
function addEvent(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, eventID: string, va: VidAffordance): EventAffordance {

    let schema = new DataSchema()
    SetDataSchema(schema, node, vid)

    let ev = td.AddEvent(eventID, va.atType, schema.title || eventID, schema.description, schema)

    if (ev.data) {
        // if (ev.data) {
        //     ev.data.description = vid.propertyName
        // }
        // SetDataSchema(ev.data, node, vid)
        ev.data.title = undefined
        ev.data.description = undefined
    }
    return ev

}

// parseNodeInfo convers a ZWave Node into a WoT TD document 
// - extract available node attributes and configuration
// - convert zwave vocabulary to WoT/HiveOT vocabulary
// - build a TD document containing properties, events and actions
// - if this is the controller node, add controller attributes and actions
// @param zwapi:
// @param node
// @param vidLogFile: optional file handle to log VID info to CSV
export function parseNode(zwapi: ZWAPI, node: ZWaveNode, vidLogFile?: number): ThingTD {
    let td: ThingTD;

    //--- Step 1: TD definition
    let deviceID = zwapi.getDeviceID(node.id)
    let deviceType = getDeviceType(node)
    // let title = node.name || node.label || node.deviceConfig?.description || deviceID;
    // let description = `${node.label} ${node.deviceConfig?.description} `;
    let title = node.name
    if (!title) {
        title = node.label || deviceID
        if (node.deviceConfig?.description) {
            title += " " + node.deviceConfig?.description
        }
    }
    let description = (node.label || deviceID) + ", " + deviceType
    if (node.deviceConfig) {
        description = node.deviceConfig.manufacturer + " " + description + ", " + node.deviceConfig.description
    }

    // if (node.deviceConfig) {
    //     description = node.deviceConfig.description
    // }
    td = new ThingTD(deviceID, deviceType, title, description);

    //--- Step 2: Add read-only attributes that are common to many nodes
    // since none of these have standard property names, use the ZWave name instead.
    // these names must match those used in parseNodeValues()
    td.AddPropertyIf(node.canSleep, "canSleep", "", "Device sleeps to conserve battery", DataType.Bool);
    td.AddProperty("endpointCount", "", "Number of endpoints", DataType.Number, node.getEndpointCount().toString());
    td.AddPropertyIf(node.firmwareVersion, "firmwareVersion", PropTypes.FirmwareVersion, "Device firmware version", DataType.String);
    td.AddPropertyIf(node.getHighestSecurityClass(), "highestSecurityClass", "", "", DataType.String);
    td.AddPropertyIf(node.interviewAttempts, "interviewAttempts", "Nr Interview Attemps", "", DataType.Number);
    if (node.interviewStage) {
        td.AddProperty("interviewStage", "", "Device Interview Stage", DataType.String)
            .SetAsEnum(InterviewStage, node.interviewStage)
    }
    td.AddPropertyIf(node.isListening, "isListening", "", "Device always listens", DataType.Bool);
    td.AddPropertyIf(node.isSecure, "isSecure", "", "Device communicates securely with controller", DataType.Bool);
    td.AddPropertyIf(node.isRouting, "isRouting", "", "Device support message routing/forwarding (if listening)", DataType.Bool);
    td.AddPropertyIf(node.isControllerNode, "isControllerNode", "", "Device is a zwave controller", DataType.Bool);
    td.AddPropertyIf(node.keepAwake, "keepAwake", "", "Device stays awake a bit longer before sending it to sleep", DataType.Bool);
    td.AddPropertyIf(node.label, "label", "", "", DataType.String);
    td.AddPropertyIf(node.manufacturerId, "manufacturerId", "", "Manufacturer ID", DataType.String);
    td.AddPropertyIf(node.deviceConfig?.manufacturer, PropTypes.Manufacturer, PropTypes.Manufacturer, PropTypes.Manufacturer, DataType.String);
    td.AddPropertyIf(node.maxDataRate, "maxDataRate", "", "Device maximum communication data rate", DataType.Number);
    if (node.nodeType) {
        td.AddProperty("nodeType", "", "ZWave node type", DataType.Number)
            .SetAsEnum(NodeType, node.nodeType)
    }
    td.AddPropertyIf(node.productId, "productId", "", "", DataType.Number);
    td.AddPropertyIf(node.productType, "productType", PropTypes.ProductName, "", DataType.Number);

    td.AddPropertyIf(node.protocolVersion, "protocolVersion", "", "ZWave protocol version", DataType.String);
    td.AddPropertyIf(node.sdkVersion, "sdkVersion", "", "", DataType.String);
    if (node.status) {
        td.AddProperty(EventTypes.Status, EventTypes.Status, "Node status", DataType.Number)
            .SetAsEnum(NodeStatus, node.status)
    }
    td.AddPropertyIf(node.supportedDataRates, "supportedDataRates", "", "ZWave Data Speed", DataType.String);
    td.AddPropertyIf(node.userIcon, "userIcon", "", "", DataType.String);

    // always show whether this is zwave+
    let prop = td.AddProperty("zwavePlusNodeType", "", "Type of ZWave+", DataType.Number, node.zwavePlusNodeType)
    if (node.zwavePlusNodeType != undefined) {
        prop.SetAsEnum(ZWavePlusNodeType, node.zwavePlusNodeType)
    } else {
        prop.initialValue = "n/a"
        prop.description = "Z-Wave+ Command Class is not supported"
    }

    if (node.zwavePlusRoleType) {
        td.AddProperty("zwavePlusRoleType", "", "Type of Z-Wave+ role of this device", DataType.Number)
            .SetAsEnum(ZWavePlusRoleType, node.zwavePlusRoleType)
    }
    td.AddPropertyIf(node.zwavePlusVersion, "zwavePlusVersion", "", "Z-Wave+ Version", DataType.Number);

    // general purpose node management
    td.AddProperty("checkLifelineHealth", "", "Check connection health", DataType.Bool,
        "Initiates tests to check the health of the connection between the controller and this node and returns the results. " +
        "This should NOT be done while there is a lot of traffic on the network because it will negatively impact the test results")
    td.AddProperty("ping", ActionTypes.Ping, "Ping the device", DataType.Bool)
    td.AddProperty("refreshInfo", ActionTypes.Refresh, "Refresh Device Info", DataType.Bool,
        "Resets (almost) all information about this node and forces a fresh interview. " +
        "After this action, the node will no longer be ready. This can take a long time.")
    td.AddProperty("refreshValues", "", "Refresh Device Values", DataType.Bool,
        "Refresh all non-static sensor and actuator values. " +
        "Use sparingly. This can take a long time and generate a lot of traffic.")

    //--- Step 4: add properties, events, and actions from the ValueIDs

    let vids = node.getDefinedValueIDs()

    for (let vid of vids) {
        let va = getVidAffordance(node, vid)
        let vidMeta = node.getValueMetadata(vid)

        // let pt = getPropType(node, vid)
        let propID = getPropID(vid)
        // the vid is either config, attr, action or event based on CC
        // let vidType = getVidType(node, vid)
        if (va) {
            logVid(vidLogFile, node, vid, propID, va)
        }

        let tditem: any
        switch (va?.affordance) {
            case "action": {
                // TODO: basic set should be an action?
                tditem = addAction(td, node, vid, propID, va)
            }
                break;
            case "event": {
                // transient values
                // if (vidValue != undefined || vidMeta.default != undefined || vidMeta.readable == false) {
                tditem = addEvent(td, node, vid, propID, va)
                // }
            }
                break;
            case "config": {
                // if there is no value then don't include the property
                // if (vidValue != undefined || vidMeta.default != undefined) {
                tditem = addConfig(td, node, vid, propID, va)
                // }
            }
                break;
            case "attr": {
                tditem = addAttribute(td, node, vid, propID, va)
            }
                break;
            default: {
                // ignore this vid
            }
        }
    }
    return td;
}


// Update the given data schema with vid data for strings, number, boolean, ...
// - title
// - description
// - readOnly, writeOnly (if defined)
// - data type: boolean, number, or string 
//   - boolean: default
//   - number: minimum, maximum, unit, enum, default
//   - string: minLength, maxLength, default
//   - default: default
function SetDataSchema(ds: DataSchema | undefined, node: ZWaveNode, vid: TranslatedValueID) {
    if (!ds) {
        return
    }
    let vidMeta = node.getValueMetadata(vid)
    ds.title = vidMeta.label ? vidMeta.label : vid.propertyName
    let value = node.getValue(vid)
    let valueName = value != undefined ? String(value) : undefined

    if (!vidMeta.readable) {
        ds.readOnly = false
        ds.writeOnly = true  // action
    }
    if (!vidMeta.writeable) {
        ds.readOnly = true   // attribute or event
    }
    // get more details on this property using its metadata and command class(es)
    switch (vidMeta.type) {
        case "string": {
            ds.type = DataType.String
            let vms = vidMeta as ValueMetadataString;
            ds.minLength = vms.minLength;
            ds.maxLength = vms.maxLength;
            ds.default = vms.default;
        }
            break;
        case "boolean": {
            ds.type = DataType.Bool
            let vmb = vidMeta as ValueMetadataBoolean;
            ds.default = vmb.default?.toString() || undefined;
        }
            break;
        case "duration":
        case "number": {
            ds.type = DataType.Number
            let vmn = vidMeta as ValueMetadataNumeric;
            ds.minimum = vmn.min;
            ds.maximum = vmn.max;
            // prop.steps = vmn.steps;
            ds.unit = vmn.unit;
            ds.default = vmn.default?.toString() || undefined;

            // if a list of states exist then the number is an enum.
            // convert the enum and use strings instead of numeric values
            if (vmn.states && Object.keys(vmn.states).length > 0) {
                ds.type = DataType.String
                valueName = vmn.states[value as number]
                // eg Operating Voltage has a value of 110 while the map has 120, 240
                if (valueName == undefined) {
                    valueName = String(value)
                }
                ds.initialValue = valueName
                // prop.allowManualEntry = (vmeta as ConfigurationMetadata).allowManualEntry || false
                ds.enum = []
                for (const k in vmn.states) {
                    ds.enum.push({
                        text: vmn.states[k],
                        value: parseInt(k),
                    })
                }
            }

        }
            break;
        case "color": {
            ds.type = DataType.Number
        }
            break;
        case "buffer":
        case "boolean[]":
        case "number[]":
        case "string[]": {
            ds.type = DataType.Array
        }
            break;
        default: {
            // TBD: does this mean there is no schema, eg no data, eg not a value?
            ds.type = DataType.Unknown
        }
    }
    ds.initialValue = valueName
    if (vidMeta.description) {
        ds.description = `${vid.commandClassName}: ${vidMeta.description}`
    } else if (vid.commandClass == CommandClasses.Configuration) {
        ds.description = `${vid.commandClassName}: ${vid.property} - ${vidMeta.label}`
    } else {
        ds.description = `${vid.commandClassName}: ${vidMeta.label}`
    }

    // if (vidMeta.valueChangeOptions) {
    //     console.log("vidMeta.valueChangeOptions:",vidMeta.valueChangeOptions)
    // }


    if (vid.propertyKey) {
        // this is a nested property
    }
    if (vidMeta.ccSpecific) {
        // additional data from the commandclass ???
        // TODO: can this be used in the description?
        let addVal: any
        switch (vid.commandClass) {
            case CommandClasses["Alarm Sensor"]: {
                addVal = vidMeta.ccSpecific.sensorType;
            }
                break;
            case CommandClasses["Binary Sensor"]: {
                addVal = vidMeta.ccSpecific.sensorType;
            }
                break;
            case CommandClasses["Indicator"]: {
                addVal = vidMeta.ccSpecific.indicatorID;
                addVal = vidMeta.ccSpecific.propertyId;
            }
                break;
            case CommandClasses["Meter"]: {
                addVal = vidMeta.ccSpecific.meterType;
                addVal = vidMeta.ccSpecific.rateType;
                addVal = vidMeta.ccSpecific.scale;
            }
                break;
            case CommandClasses["Multilevel Sensor"]: {
                addVal = vidMeta.ccSpecific.sensorType;
                addVal = vidMeta.ccSpecific.scale;
            }
                break;
            case CommandClasses["Multilevel Switch"]: {
                addVal = vidMeta.ccSpecific.switchType;
            }
                break;
            case CommandClasses["Notification"]: {
                addVal = vidMeta.ccSpecific.notificationType;
            }
                break;
            case CommandClasses["Thermostat Setpoint"]: {
                addVal = vidMeta.ccSpecific.setpointType;
            }
                break;
        }
        if (addVal) {
            console.log("addval=", addVal)
        }
    }
}

//
// // Split the deviceID into homeID and nodeID
// export function splitDeviceID(deviceID: string): [string, number | undefined] {
//     let parts = deviceID.split(".")
//     if (parts.length == 2) {
//         return [parts[0], parseInt(parts[1])]
//     }
//     return ["", undefined]
// }
