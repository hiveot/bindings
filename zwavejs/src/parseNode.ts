import { BinarySensorType, getEnumMemberName, MultilevelSwitchCommand, NodeStatus, ValueID, ValueType, ZWaveNode, ZWavePlusNodeType, ZWavePlusRoleType, ValueMetadataString, ValueMetadataNumeric, ValueMetadataBoolean, ValueMetadataAny, Driver, CommandClass, ConfigurationCC, BatteryReplacementStatus, ManufacturerSpecificCC, ManufacturerSpecificCCGet, TranslatedValueID, AlarmSensorValueMetadata, AlarmSensorCC } from "zwave-js";
import { CommandClasses, InterviewStage, SecurityClass } from '@zwave-js/core';
import { ActionAffordance, DataSchema, EventAffordance, PropertyAffordance, ThingTD } from "./thing.js";
import { DataType, PropNameDeviceType, PropNameManufacturer, PropNameName, PropNameProduct, PropNameSoftwareVersion } from "./vocabulary.js";
import type { ZWAPI } from "./zwapi.js";


// map of commandclass to identification
type TypeInfo = {
    isAttr?: boolean;
    isConfig?: boolean;
    isEvent?: boolean;
};
const CCIDMap = new Map<CommandClasses, TypeInfo>([
    [CommandClasses["Alarm Sensor"], {}],
    // Central Scene notification => event
    [CommandClasses["Central Scene"], { isEvent: true }],
    // todo
])



// Add the zwave value data to the TD as an action
function addAction(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, name: string): ActionAffordance {
    let vidMeta = node.getValueMetadata(vid)
    let action = td.AddAction(name, "", DataType.Unknown)
    // move title and description. No need to duplicate
    if (action.input) {
        SetDataSchema(action.input, node, vid)
        action.title = action.input?.title
        action.description = action.input?.description
        action.input.title = undefined
        action.input.description = undefined
    }
    return action
}

// Add the zwave value data to the TD as an attribute property
function addAttribute(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, name: string): PropertyAffordance {
    let vidMeta = node.getValueMetadata(vid)
    let prop = td.AddProperty(name, "", DataType.Unknown)
    SetDataSchema(prop, node, vid)
    return prop
}

// Add the zwave value data to the TD as a configuration property
function addConfig(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, name: string): PropertyAffordance {
    let paramMap = node.deviceConfig?.paramInformation
    // todo: how to get parameter number?
    let paramNr = vid.property
    let vidMeta = node.getValueMetadata(vid)
    let prop = td.AddProperty(name, "", DataType.Unknown)
    prop.readOnly = false
    SetDataSchema(prop, node, vid)

    return prop

}

// Add the zwave value data to the TD as an event
function addEvent(td: ThingTD, node: ZWaveNode, vid: TranslatedValueID, name: string): EventAffordance {
    let vidMeta = node.getValueMetadata(vid)

    if (vid.commandClass == CommandClasses.Notification) {
        // notification CC sometimes has an extra 'propertKeyName' which is
        // a sublevel of property. This should be the property name/title.
        // eg '2 - thingie'
        if (vid.propertyKeyName) {
            name = vid.propertyKeyName
        }
    }
    let ev = td.AddEvent(name, "", DataType.Unknown)

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


// The device ID used in publishing the node's TD
export function getDeviceID(homeID: string, node: ZWaveNode): string {
    let deviceID = homeID + "." + node.id.toString();
    return deviceID
}

// Determine the device type of the node in the HiveOT vocabulary
// TODO: convert to device type vocabulary
export function getDeviceType(node: ZWaveNode): string {
    let deviceClass = node.deviceClass ? node.deviceClass.basic.label : "unknown";
    let deviceClassGeneric = node.deviceClass?.generic.label;
    let cc = node.deviceClass?.generic.supportedCCs
    let deviceClassSpecific = node.deviceClass?.specific.label;

    let deviceType = deviceClassGeneric ? deviceClassGeneric : node.name ? node.name : "n/a";

    // the descriptions of deviceClassSpecific is worse for controller, wallmote switch and evernote sensors
    // let deviceType = deviceClassSpecific ? deviceClassSpecific :
    //     deviceClassGeneric ? deviceClassGeneric : node.name ? node.name : "n/a";

    return deviceType
}

// getPropName returns the property instance ID for identifying the property 
// used in TD property map and events
export function getPropName(vid: TranslatedValueID): string {
    // most properties only have vid.property as the property name.
    // Multi endpoint devices sometimes have vid.propertyKey set with sub-property ID, which will be
    // used instead.
    if (vid.propertyKey != undefined) {
        return `${vid.propertyKey}`
    }
    return `${vid.property}`
}

// determine the type of vid this is
// this returns 
//  action: the vid is not readable
//  event: the vid is a readonly command CC ?
//  attr: the vid is read-only and not an event
//  config: the vid is writable and not an action
function getVidType(node: ZWaveNode, vid: TranslatedValueID): "action" | "event" | "config" | "attr" {
    let vidMeta = node.getValueMetadata(vid)

    if (vid.commandClass === CommandClasses.Configuration) {
        return "config"
    }

    if (!vidMeta.readable) {
        return "action"
    }
    if (vidMeta.writeable) {
        return "config"
    }
    if (vid.commandClass === CommandClasses.Notification) {
        return "event"
    }
    // either an attribute or event
    if (vid.commandClass === CommandClasses.Basic) {
        // TODO: does this CC implies an action? -> no
        return "attr"
    }
    // TODO:what about generic classes
    if (vid.commandClass === CommandClasses["Binary Switch"]) {
        // is this event, action, and/or a property?
        return "attr"
    }
    return "attr"
}

// parseNodeInfo convers a ZWave Node into a WoT TD document 
// - extract available node attributes and configuration
// - extract node events
// - extract node actions
// - convert zwave vocabulary to WoT/HiveOT vocabulary
// - build a TD document containing properties, events and actions
export function parseNode(zwapi: ZWAPI, node: ZWaveNode): ThingTD {
    let td: ThingTD;

    //--- Step 1: TD definition
    let deviceID = getDeviceID(zwapi.homeID, node)
    // TODO: determine deviceType based on generic/specific CC name
    let deviceType = getDeviceType(node)
    let title = node.name ? node.name : "";
    let description = "";
    let publisherID = "zwavejs";
    if (node.deviceConfig) {
        description = node.deviceConfig.description
    }
    td = new ThingTD(deviceID, publisherID, deviceType, title, description);

    //--- Step 2: Add read-only attributes that are common to many nodes
    // since none of these have standard property names, use the ZWave name instead.
    // these names must match those used in parseNodeValues()
    td.AddPropertyIf(node.canSleep, "canSleep", "Device sleeps to conserve battery", DataType.Bool);
    td.AddProperty("endpointCount", "Number of endpoints", DataType.Number);
    td.AddPropertyIf(node.firmwareVersion, PropNameSoftwareVersion, "", DataType.String);
    td.AddPropertyIf(node.getHighestSecurityClass(), "highestSecurityClass", "", DataType.String);
    td.AddPropertyIf(node.interviewAttempts, "interviewAttempts", "", DataType.Number);
    td.AddPropertyIf(node.interviewStage, "interviewState", "", DataType.String);
    td.AddPropertyIf(node.isListening, "isListening", "Device always listens", DataType.Bool);
    td.AddPropertyIf(node.isSecure, "isSecure", "Device communicates securely with controller", DataType.Bool);
    td.AddPropertyIf(node.isRouting, "isRouting", "Device support message routing/forwarding (if listening)", DataType.Bool);
    td.AddPropertyIf(node.isControllerNode, "isControllerNode", "Device is a zwave controller", DataType.Bool);
    td.AddPropertyIf(node.keepAwake, "keepAwake", "Device stays awake a bit longer before sending it to sleep", DataType.Bool);
    td.AddPropertyIf(node.label, "label", "", DataType.String);
    td.AddPropertyIf(node.manufacturerId, "manufacturerId", "Manufacturer ID", DataType.String);
    td.AddPropertyIf(node.deviceConfig?.manufacturer, PropNameManufacturer, "", DataType.String);
    td.AddPropertyIf(node.maxDataRate, "maxDataRate", "Device maximum communication data rate", DataType.Number);
    td.AddPropertyIf(node.nodeType, "nodeType", "", DataType.String);
    td.AddPropertyIf(node.nodeType, "nodeTypeName", "", DataType.String);
    td.AddPropertyIf(node.productId, "productID", "", DataType.Number);
    td.AddPropertyIf(node.productType, "productType", "", DataType.Number);
    td.AddPropertyIf(node.protocolVersion, "protocolVersion", "", DataType.String);
    td.AddPropertyIf(node.sdkVersion, "sdkVersion", "", DataType.String);
    td.AddPropertyIf(node.status, "status", "status ID", DataType.Number);
    td.AddPropertyIf(node.status, "statusName", "status", DataType.String);
    td.AddPropertyIf(node.supportedDataRates, "supportedDataRates", "", DataType.String);
    td.AddPropertyIf(node.userIcon, "userIcon", "", DataType.String);
    td.AddPropertyIf(node.zwavePlusNodeType, "zwavePlusNodeType", "", DataType.Number);
    if (node.zwavePlusNodeType) {
        let nodeTypeName = getEnumMemberName(ZWavePlusNodeType, node.zwavePlusNodeType)
        td.AddPropertyIf(nodeTypeName, "zwavePlusNodeTypeName", "", DataType.String);
    }
    td.AddPropertyIf(node.zwavePlusRoleType, "zwavePlusRoleType", "", DataType.Number);
    td.AddPropertyIf(node.zwavePlusRoleType, "zwavePlusRoleTypeName", "", DataType.Number);
    if (node.zwavePlusRoleType) {
        td.AddProperty("zwavePlusRoleTypeName", "", DataType.String);
    }
    td.AddPropertyIf(node.zwavePlusVersion, "zwavePlusVersion", "", DataType.Number);

    //--- Step 3: add properties, events, and actions from the ValueIDs
    let vids = node.getDefinedValueIDs()

    for (let vid of vids) {
        let vidValue = node.getValue(vid)
        let vidMeta = node.getValueMetadata(vid)

        let propName = getPropName(vid)
        let dc = node.deviceConfig

        // the vid is either config, attr, action or event based on CC
        let vidType = getVidType(node, vid)
        let tditem: any
        switch (vidType) {
            case "action": {
                // TODO: basic set should be an action
                tditem = addAction(td, node, vid, propName)
            } break;
            case "event": {
                tditem = addEvent(td, node, vid, propName)
            } break;
            case "config": {
                tditem = addConfig(td, node, vid, propName)
            } break;
            default: {
                tditem = addAttribute(td, node, vid, propName)
            } break;
        }

        // TODO: map command classes to events and actions
        switch (vid.commandClass) {
            case CommandClasses.Basic: {
                // a basic get (read) represents the value of the device
                // is this an event or property?
                // or a property whose change is an event?
            } break;
            case CommandClasses.Version: {
                // let api = node.commandClasses.Version.getCapabilities()
            } break;
            case CommandClasses["Manufacturer Specific"]: {
                // let api = node.commandClasses["Manufacturer Specific"]
            } break;
            case CommandClasses.Configuration: {
                let api = node.commandClasses.Configuration
            } break;
            case CommandClasses.Notification: {
            } break;
            case CommandClasses.Battery: {
            } break;
            default:
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
        } break;
        case "boolean": {
            ds.type = DataType.Bool
            let vmb = vidMeta as ValueMetadataBoolean;
            ds.default = vmb.default?.toString() || undefined;
        } break;
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

        } break;
    }
    if (vidMeta.description) {
        ds.description = `${vid.commandClassName}: ${vidMeta.description}`
    } else if (vid.commandClass == CommandClasses.Configuration) {
        ds.description = `${vid.commandClassName}: param ${vid.property} - ${vidMeta.label}`
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
            } break;
            case CommandClasses["Binary Sensor"]: {
                addVal = vidMeta.ccSpecific.sensorType;
            } break;
            case CommandClasses["Indicator"]: {
                addVal = vidMeta.ccSpecific.indicatorID;
                addVal = vidMeta.ccSpecific.propertyId;
            } break;
            case CommandClasses["Meter"]: {
                addVal = vidMeta.ccSpecific.meterType;
                addVal = vidMeta.ccSpecific.rateType;
                addVal = vidMeta.ccSpecific.scale;
            } break;
            case CommandClasses["Multilevel Sensor"]: {
                addVal = vidMeta.ccSpecific.sensorType;
                addVal = vidMeta.ccSpecific.scale;
            } break;
            case CommandClasses["Multilevel Switch"]: {
                addVal = vidMeta.ccSpecific.switchType;
            } break;
            case CommandClasses["Notification"]: {
                addVal = vidMeta.ccSpecific.notificationType;
            } break;
            case CommandClasses["Thermostat Setpoint"]: {
                addVal = vidMeta.ccSpecific.setpointType;
            } break;
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
