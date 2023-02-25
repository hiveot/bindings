import {
    getEnumMemberName,
    NodeStatus,
    NodeType,
    TranslatedValueID,
    ValueMetadata,
    ValueMetadataBoolean,
    ValueMetadataNumeric,
    ValueMetadataString,
    ZWaveNode,
    ZWavePlusNodeType,
    ZWavePlusRoleType
} from "zwave-js";
import {CommandClasses, InterviewStage} from '@zwave-js/core';
import {ActionAffordance, DataSchema, EventAffordance, PropertyAffordance, ThingTD} from "../lib/thing.js";
import {DataType, VocabManufacturer, VocabSoftwareVersion} from "../lib/vocabulary.js";
import type {ZWAPI} from "./zwapi.js";

// Fixed events emitted by a node
export const EventNameAlive = "alive"
export const EventNameInclusion = "inclusion"

// map of commandclass to identification
type TypeInfo = {
    isAttr?: boolean;
    isConfig?: boolean;
    isEvent?: boolean;
};
const CCIDMap = new Map<CommandClasses, TypeInfo>([
    [CommandClasses["Alarm Sensor"], {}],
    // Central Scene notification => event
    [CommandClasses["Central Scene"], {isEvent: true}],
    // todo
])


// Add the zwave value data to the TD as an action
function addAction(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, actionID: string): ActionAffordance {
    let vidMeta = node.getValueMetadata(vid)
    let action = td.AddAction(actionID, "", DataType.Unknown)

    // move title and description. No need to duplicate
    if (action.input) {
        SetDataSchema(action.input, node, vid)
        action.title = action.input?.title
        action.description = action.input?.description
        action.input.title = undefined
        action.input.description = undefined
        action.input.readOnly = false
    }
    return action
}

// Add the zwave value data to the TD as an attribute property
function addAttribute(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, propID: string, initialValue: any): PropertyAffordance {
    let vidMeta = node.getValueMetadata(vid)
    let prop = td.AddProperty(propID, "", DataType.Unknown, initialValue)
    // SetDataSchema also sets the title and data type
    SetDataSchema(prop, node, vid)
    return prop
}

// Add the zwave value data to the TD as a configuration property
function addConfig(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, propID: string, initialValue: any): PropertyAffordance {
    let paramMap = node.deviceConfig?.paramInformation
    let paramNr = vid.property
    let vidMeta = node.getValueMetadata(vid)
    let prop = td.AddProperty(propID, "", DataType.Unknown, initialValue)
    prop.readOnly = false
    // SetDataSchema also sets the title and data type
    SetDataSchema(prop, node, vid)

    return prop

}

// Add the zwave value data to the TD as an event
function addEvent(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, eventID: string): EventAffordance {
    let vidMeta = node.getValueMetadata(vid)
    let ev = td.AddEvent(eventID, "", DataType.Unknown)

    if (ev.data) {
        if (ev.data) {
            ev.data.description = vid.propertyName
        }
        SetDataSchema(ev.data, node, vid)
        ev.title = ev.data?.title
        ev.description = ev.data?.description
        ev.data.title = undefined
        ev.data.description = undefined
    }
    return ev

}


// getDeviceType returns the device type of the node in the HiveOT vocabulary
// this is based on the device class name. eg 'Binary Switch' and will be converted to the HiveOT vocabulary
export function getDeviceType(node: ZWaveNode): string {
    let deviceClassGeneric = node.deviceClass?.generic.label;
    let deviceClassBasic = node.deviceClass?.basic.label;
    let deviceClassSpecific = node.deviceClass?.specific.label;
    let deviceType: string;

    deviceType = deviceClassGeneric ? deviceClassGeneric : node.name ? node.name : "n/a";
    // device class basic just says 'static controller' or 'routing slave'
    // if (node.deviceClass?.basic.label) {
    //     deviceType = deviceClassBasic ? deviceClassBasic : deviceType;
    // }
    // specific doesn't add anything useful, sometimes the opposite (Routing Multilevel Sensor)
    // if (node.deviceClass?.specific.label) {
    //     deviceType = deviceClassSpecific ? deviceClassSpecific : deviceType;
    // }

    // TODO: map the zwave CC to the HiveOT vocabulary

    return deviceType
}

// getPropID returns the property instance ID for identifying the property used in TD property map and events.
export function getPropID(vid: TranslatedValueID, vidMeta: ValueMetadata): string {
    // rules:
    // 1. by default, use 'vid.propertyName'
    // 2. append 'vid.propertyKey' if not undefined
    // 3. append 'vid.endpoint' if not undefined
    //
    // let propName = vidMeta.label ? vidMeta.label : vid.propertyName || vid.commandClassName
    let propID = vid.propertyName ? vid.propertyName : ""
    if (vid.propertyKey) {
        propID += "-"+ vid.propertyKey
    }
    if (vid.endpoint) {
        propID += "-"+vid.endpoint
    }
    // if (vid.commandClass == CommandClasses.Configuration) {
    //     propID = `${vid.property} - ${vidMeta.label}`
    // }
    return propID
}

// Determine whether the vid is a property, event or action
// this returns 
//  action: the vid is writable and not readable
//  event: the vid is a readonly command CC ?
//  attr: the vid is read-only, not an event, and has a value or default
//  config: the vid is writable, not an action, and has a value or default
//  undefined if the vid CC is deprecated or obsolete
function getVidType(node: ZWaveNode, vid: TranslatedValueID): "action" | "event" | "config" | "attr" |undefined{
    let vidMeta = node.getValueMetadata(vid)

    switch (vid.commandClass) {
        // While Basic Set is an action/event, we don't want to use it as this is just a fallback CC
        case CommandClasses.Basic:
        {
            return vidMeta.writeable ? "action" : "event";
            // return "attr"
        }
        //--- CC's for actions/actuator devices
        case CommandClasses["Alarm Silence"]:
        case CommandClasses["Barrier Operator"]:
        case CommandClasses["Binary Switch"]:
        case CommandClasses["Binary Toggle Switch"]:
        case CommandClasses["Door Lock"] :
        case CommandClasses["HRV Control"] :
        case CommandClasses["Humidity Control Mode"] :
        case CommandClasses["Indicator"] :
        case CommandClasses["Multilevel Switch"] :
        case CommandClasses["Simple AV Control"] :
        case CommandClasses["Window Covering"]:
        {
            return vidMeta.writeable ? "action" : "event";
        }

        //-- CC's for data reporting devices
        case CommandClasses["Authentication"]:
        case CommandClasses["Binary Sensor"]:
        case CommandClasses["Central Scene"]:
        case CommandClasses["Entry Control"]:
        case CommandClasses["Energy Production"]:
        case CommandClasses["HRV Status"]:
        case CommandClasses["Humidity Control Operating State"] :
        case CommandClasses["Multilevel Sensor"]:
        case CommandClasses.Meter:
        case CommandClasses["Meter Table Monitor"]:
        case CommandClasses.Notification:
        case CommandClasses["Sound Switch"]:
        case CommandClasses["Thermostat Fan State"]:
        case CommandClasses["Thermostat Operating State"]: {
            return "event"
        }
        //--- CC's for configuration or attributes
        case CommandClasses["Anti-Theft"]:
        case CommandClasses["Anti-Theft Unlock"]:
        case CommandClasses["Color Switch"] :
        case CommandClasses.Configuration:
        case CommandClasses["Generic Schedule"]:
        case CommandClasses["Humidity Control Setpoint"] :
        case CommandClasses["Irrigation"]:
        case CommandClasses["Meter Table Configuration"]:
        case CommandClasses["Meter Table Push Configuration"]:
        case CommandClasses["Schedule"]:
        case CommandClasses["Scene Actuator Configuration"]:     // 1..255 scene IDs
        case CommandClasses["Scene Controller Configuration"]:   // 1..255 scene IDs
        case CommandClasses["Thermostat Fan Mode"]:
        case CommandClasses["Thermostat Mode"] :
        case CommandClasses["Thermostat Setpoint"]:
        case CommandClasses["Thermostat Setback"]:
        case CommandClasses["Tariff Table Configuration"]:
        case CommandClasses["User Code"]: {
            return vidMeta.writeable ? "config": "attr"
        }

        case CommandClasses["Wake Up"]: {
            // wakeup interval is config, wakeup report is attr, wakeup notification is event
            // FIXME: determine if this is a wakeup notification (event)
            return vidMeta.writeable ? "config": "attr"
        }

        //--- deprecated CCs
        case CommandClasses["All Switch"]:  //
        case CommandClasses["Alarm Sensor"]:  // nodes also have Notification CC
        {
            return undefined
        }
    }

    if (!vidMeta.readable) {
        return vidMeta.writeable ? "action":"event"
    }
    if (vidMeta.writeable) {
        return "config"
    }
    return "attr"
}

// parseNodeInfo convers a ZWave Node into a WoT TD document 
// - extract available node attributes and configuration
// - convert zwave vocabulary to WoT/HiveOT vocabulary
// - build a TD document containing properties, events and actions
// - if this is the controller node, add controller attributes and actions
export function parseNode(zwapi: ZWAPI, node: ZWaveNode): ThingTD {
    let td: ThingTD;

    //--- Step 1: TD definition
    let deviceID = zwapi.getDeviceID(node.id)
    let deviceType = getDeviceType(node)
    let title = node.name || node.label || node.deviceConfig?.description || deviceID;
    let description = `${node.label} ${node.deviceConfig?.description} `;
    let publisherID = "zwavejs";

    // if (node.deviceConfig) {
    //     description = node.deviceConfig.description
    // }
    td = new ThingTD(deviceID, deviceType, title, description);

    //--- Step 2: Add read-only attributes that are common to many nodes
    // since none of these have standard property names, use the ZWave name instead.
    // these names must match those used in parseNodeValues()
    td.AddPropertyIf(node.canSleep, "canSleep", "Device sleeps to conserve battery", DataType.Bool);
    td.AddProperty("endpointCount", "Number of endpoints", DataType.Number, node.getEndpointCount());
    td.AddPropertyIf(node.firmwareVersion, VocabSoftwareVersion, "", DataType.String);
    td.AddPropertyIf(node.getHighestSecurityClass(), "highestSecurityClass", "", DataType.String);
    td.AddPropertyIf(node.interviewAttempts, "interviewAttempts", "", DataType.Number);
    if (node.interviewStage) {
        td.AddProperty("interviewStage", "", DataType.String, node.interviewStage);
        let interviewStageName =getEnumMemberName(InterviewStage, node.interviewStage)
        td.AddProperty("interviewStageName", "", DataType.String, interviewStageName);
    }
    td.AddPropertyIf(node.isListening, "isListening", "Device always listens", DataType.Bool);
    td.AddPropertyIf(node.isSecure, "isSecure", "Device communicates securely with controller", DataType.Bool);
    td.AddPropertyIf(node.isRouting, "isRouting", "Device support message routing/forwarding (if listening)", DataType.Bool);
    td.AddPropertyIf(node.isControllerNode, "isControllerNode", "Device is a zwave controller", DataType.Bool);
    td.AddPropertyIf(node.keepAwake, "keepAwake", "Device stays awake a bit longer before sending it to sleep", DataType.Bool);
    td.AddPropertyIf(node.label, "label", "", DataType.String);
    td.AddPropertyIf(node.manufacturerId, "manufacturerId", "Manufacturer ID", DataType.String);
    td.AddPropertyIf(node.deviceConfig?.manufacturer, VocabManufacturer, "", DataType.String);
    td.AddPropertyIf(node.maxDataRate, "maxDataRate", "Device maximum communication data rate", DataType.Number);
    if (node.nodeType) {
        td.AddProperty("nodeType", "", DataType.String, node.nodeType);
        let nodeTypeName = getEnumMemberName(NodeType, node.nodeType)
        td.AddProperty("nodeTypeName", "", DataType.String, nodeTypeName);
    }
    td.AddPropertyIf(node.productId, "productId", "", DataType.Number);
    td.AddPropertyIf(node.productType, "productType", "", DataType.Number);
    td.AddPropertyIf(node.protocolVersion, "protocolVersion", "", DataType.String);
    td.AddPropertyIf(node.sdkVersion, "sdkVersion", "", DataType.String);
    if (node.status) {
        td.AddProperty("status", "status ID", DataType.Number, node.status);
        let statusName = getEnumMemberName(NodeStatus, node.status)
        td.AddProperty("statusName", "status", DataType.String, statusName);
    }
    td.AddPropertyIf(node.supportedDataRates, "supportedDataRates", "", DataType.String);
    td.AddPropertyIf(node.userIcon, "userIcon", "", DataType.String);
    if (node.zwavePlusNodeType) {
        td.AddProperty("zwavePlusNodeType", "", DataType.Number, node.zwavePlusNodeType);
        let nodeTypeName = getEnumMemberName(ZWavePlusNodeType, node.zwavePlusNodeType)
        td.AddProperty("zwavePlusNodeTypeName", "", DataType.String, nodeTypeName);
    }
    td.AddPropertyIf(node.zwavePlusRoleType, "zwavePlusRoleType", "", DataType.Number);
    if (node.zwavePlusRoleType) {
        let roleTypeName = getEnumMemberName(ZWavePlusRoleType, node.zwavePlusRoleType)
        td.AddProperty("zwavePlusRoleTypeName", "", DataType.String, roleTypeName);
    }
    td.AddPropertyIf(node.zwavePlusVersion, "zwavePlusVersion", "", DataType.Number);

    //--- Step 3: add node state events and actions
    // FIXME: These names must match the event emitter in binding.ts
    td.AddEvent(EventNameInclusion, "inclusion","Node interview status", "")
     .data = new DataSchema({
        title:"Progress",
        type: DataType.String,
        enum: ["interview started", "interview completed", "interview failed"]
    })

    td.AddEvent(EventNameAlive, EventNameAlive,"Node alive status")
     .data = new DataSchema({
        title:"Status",
        type: DataType.String,
        enum: ["sleeping", "awake", "alive", "dead"]
     })

    // general purpose node actions
    // FIXME: These names must match the action handler in binding.ts
    td.AddAction("refreshInfo", "refreshInfo", "Refresh Device Info","Reset nearly all node info")
    td.AddAction("refreshValues", "refreshValues","Refresh Values","Refresh all non-static sensor and actuator values")
    td.AddAction("ping", "ping", "Ping the device")

    //--- Step 4: add properties, events, and actions from the ValueIDs
    let vids = node.getDefinedValueIDs()

    for (let vid of vids) {
        let vidValue = node.getValue(vid)
        let vidMeta = node.getValueMetadata(vid)

        let propID = getPropID(vid, vidMeta)
        let dc = node.deviceConfig

        // the vid is either config, attr, action or event based on CC
        let vidType = getVidType(node, vid)
        let tditem: any
        switch (vidType) {
            case "action": {
                // TODO: basic set should be an action
                tditem = addAction(td, node, vid, propID)
            } break;
            case "event": {
                tditem = addEvent(td, node, vid, propID)
            } break;
            case "config": {
                // if there is no value then don't include it
                if (vidValue != undefined || vidMeta.default) {
                    tditem = addConfig(td, node, vid, propID, vidValue)
                }
            } break;
            default: {
                // if there is no value then don't include it
                if (vidValue != undefined || vidMeta.default) {
                    tditem = addAttribute(td, node, vid, propID, vidValue)
                }
            } break;
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
    let valueName = value ? value : ""

    if (vidMeta.readable === false) {
        ds.readOnly = false
        ds.writeOnly = true  // action
    }
    if (vidMeta.writeable === false) {
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

            // names for numeric values
            if (vmn.states && Object.keys(vmn.states).length > 0) {
                valueName = vmn.states[value as number]
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
    }
    if (vidMeta.description) {
        ds.description = `${vid.commandClassName}: ${vidMeta.description}`
    } else if (vid.commandClass == CommandClasses.Configuration) {
        ds.description = `${vid.commandClassName}: ${vid.property} - ${vidMeta.label}`
    } else {
        ds.description = `${vid.commandClassName}: ${vidMeta.label}`
    }
    if (valueName) {
        ds.description += ` (${valueName})`
    }


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


// Split the deviceID into homeID and nodeID
export function splitDeviceID(deviceID: string): [string, number | undefined] {
    let parts = deviceID.split(".")
    if (parts.length == 2) {
        return [parts[0], parseInt(parts[1])]
    }
    return ["", undefined]
}
