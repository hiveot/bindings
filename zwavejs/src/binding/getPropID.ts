
// getPropID returns the property instance ID for identifying the property used in TD property map and events.
// This provides the {vid.propertyName}[-{vid.propertyKeyName}][-{vid.endpoint}]
// Used for TD properties, events, actions and for sending events
import type {TranslatedValueID, ValueMetadata} from "zwave-js";

export function getPropID(vid: TranslatedValueID, vidMeta: ValueMetadata): string {
    let propID = vid.propertyName ? vid.propertyName : ""
    if (vid.propertyKey) {
        // prefer to use the name for readibility
        if (vid.propertyKeyName) {
            propID += "-" + vid.propertyKeyName
        } else {
            propID += "-" + vid.propertyKey
        }
    }
    if (vid.endpoint) {
        propID += "-"+vid.endpoint
    }
    // if (vid.commandClass == CommandClasses.Configuration) {
    //     propID = `${vid.property} - ${vidMeta.label}`
    // }
    return propID
}
