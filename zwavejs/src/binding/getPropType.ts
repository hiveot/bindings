import {PropTypes} from "../lib/vocabulary.js";
import type {TranslatedValueID} from "@zwave-js/core";
import type {ZWaveNode} from "zwave-js";

export type PropType = {
	typeName: string,
	affordance:  "action" | "event" | "prop"
}

// Map zwavejs propertyName field to HiveOT property types
const propTypeMap: Map<string,PropType> = new Map([
	["currentValue" , {
		typeName: PropTypes.CPULevel,
		affordance: "prop",
	}]
]);

// Return the standardized property type name for the given VID
// The standardized type name is to be used for the @type field in properties, events and actions
// and intended for the consumer to group similar property types for presentation.
// A property type implies
// This returns an empty string if the vid is not recognized
export function getPropType(node:ZWaveNode, vid:TranslatedValueID): PropType|undefined {
	let propName = vid.propertyName || ""
	let pt = propTypeMap.get(propName)
	return pt
}
