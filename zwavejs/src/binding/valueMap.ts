import { ConfigManager } from "@zwave-js/config";
import { cp } from "fs";
import {
    getEnumMemberName, NodeStatus,
    ZWaveNode, ZWavePlusNodeType, ZWavePlusRoleType,
} from "zwave-js";
import { CommandClasses, InterviewStage, SecurityClass } from '@zwave-js/core';
import {PropTypes} from "../lib/vocabulary.js";



// Value map for node values
export class ValueMap extends Map<string, any> {
    // @param node: create the map for this node
    constructor(node?: ZWaveNode) {
        super()
        if (node) {
            this.parseNodeValues(node)
        }
    }
    // Set a value if it is not undefined 
    setIf(key: string, val: any) {
        if (val != undefined) {
            this.set(key, val)
        }
    }

    // compare the current value map with an old map and return a new value map with the differences 
    // This only returns values if they exist in the current map.
    diffValues(oldValues: ValueMap): ValueMap {
        let diffMap = new ValueMap()
        for (let [key, newVal] of this) {
            let oldVal = oldValues.get(key)
            if (newVal !== oldVal) {
                diffMap.set(key, newVal)
            }
        }
        return diffMap
    }

    // parseNodeValues updates the value map with the latest node value
    parseNodeValues(node: ZWaveNode) {

        //--- Node read-only attributes that are common to many nodes
        this.setIf("associationCount", node.deviceConfig?.associations?.size);
        this.setIf("canSleep", node.canSleep);
        this.setIf("description", node.deviceConfig?.description);

        if (node.deviceClass) {
            this.setIf("deviceClassBasic", node.deviceClass.basic.label);
            this.setIf("deviceClassGeneric", node.deviceClass.generic.label);
            this.setIf("deviceClassSpecific", node.deviceClass.specific.label);
            this.setIf("supportedCCs", node.deviceClass.generic.supportedCCs);
        }
        this.setIf("endpointCount", node.getEndpointCount().toString());
        // this.setIf("dc.firmwareVersion", node.deviceConfig?.firmwareVersion);
        this.setIf("firmwareVersion", node.firmwareVersion?.toString());

        if (node.getHighestSecurityClass()) {
            let classID = node.getHighestSecurityClass() as number
            let highestSecClass = `${getEnumMemberName(SecurityClass, classID)} (${classID})`
            this.setIf("highestSecurityClass", highestSecClass);
        }

        this.setIf("interviewAttempts", node.interviewAttempts);
        this.setIf("interviewStage", getEnumMemberName(InterviewStage, node.interviewStage));
        this.setIf("isListening", node.isListening);
        this.setIf("isSecure", node.isSecure);
        this.setIf("isRouting", node.isRouting);
        this.setIf("isControllerNode", node.isControllerNode)
        this.setIf("keepAwake", node.keepAwake);
        this.setIf("label", node.deviceConfig?.label)
        this.setIf("manufacturerId", node.manufacturerId);
        this.setIf(PropTypes.Manufacturer, node.deviceConfig?.manufacturer);

        this.setIf("maxDataRate", node.maxDataRate)
        if (node.nodeType) {
            this.setIf("nodeType", node.nodeType);
            this.setIf("nodeTypName", getEnumMemberName(ZWavePlusNodeType, node.nodeType));
        }
        this.setIf("paramCount", node.deviceConfig?.paramInformation?.size);
        this.setIf("productID", node.productId);
        this.setIf("productType", node.productType);
        this.setIf("protocolVersion", node.protocolVersion);
        this.setIf("sdkVersion", node.sdkVersion);
        this.setIf("status", node.status);
        this.setIf("statusName", getEnumMemberName(NodeStatus, node.status));
        this.setIf("supportedDataRates", node.supportedDataRates);
        this.setIf("userIcon", node.userIcon);
        if (node.zwavePlusNodeType) {
            this.setIf("zwPlusType", node.zwavePlusNodeType);
            this.setIf("zwPlusTypeName", getEnumMemberName(ZWavePlusNodeType, node.zwavePlusNodeType));
        }
        if (node.zwavePlusRoleType) {
            this.setIf("zwavePlusRoleType", node.zwavePlusRoleType);
            this.setIf("zwavePlusRoleTypeName", getEnumMemberName(ZWavePlusRoleType, node.zwavePlusRoleType));
        }
        this.setIf("zwPlusVersion", node.zwavePlusVersion);

        // add value ID values
        let vids = node.getDefinedValueIDs()
        for (let vid of vids) {
            let vidValue = node.getValue(vid)
            let vidMeta = node.getValueMetadata(vid)
            // TODO: map property names to vocabulary
            let name = vid.propertyName || vid.property.toString()
            // let propType = ValueTypeToDataType(vidMeta.type)

            this.setIf(name, vidValue)
        }
    }

    // serialize this map to a JSON document
    serialize(): string {
        return JSON.stringify(this)
    }
}




// // Convert the zwave ValueType to HiveOT DataType
// export function ValueTypeToDataType(valueType: ValueType): DataType {
//     // number -> number
//     // string -> string
//     // boolean -> boolean
//     switch (valueType) {
//         case "string":
//             return DataType.String;
//         case "boolean":
//             return DataType.Bool;
//         case "number":
//             return DataType.Number;
//         case "string[]":
//             return DataType.Array;
//         case "boolean[]":
//             return DataType.Array;
//         case "number[]":
//             return DataType.Array;

//     }
//     return DataType.String;
// }
