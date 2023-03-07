import type {TranslatedValueID, ZWaveNode} from "zwave-js";
import {CommandClasses} from "@zwave-js/core";

// Determine whether the vid is an attr, config, event, action or to be ignored
// this returns
//  action: the vid is writable and not readable
//  event: the vid is a readonly command CC ?
//  attr: the vid is read-only, not an event, and has a value or default
//  config: the vid is writable, not an action, and has a value or default
//  undefined if the vid CC is deprecated or the vid is to be ignored
export function getVidType(node: ZWaveNode, vid: TranslatedValueID): "action" | "event" | "config" | "attr" | undefined {
    let vidMeta = node.getValueMetadata(vid)
    const MaxNrScenes = 10  // TODO: make configurable

    // 1. Binary Switch: targetValue is a config, not an action;
    // 1b. valueChangeOptions =["transitionDuration"]   is this the config parameter?
    // 2. Meter:reset[-1] is an action, not an event  (DSC-18103)
    // OK: Param 1: report type doesn't show => replaced by Automatic Report Group 1 - Current, Power,Voltage,kWh
    // 3. Param 255 Reset config to default is a config, not an event (DSC-18103)
    // 4. Param 254 Device Tag doesn't show (DSC-18103)
    // 5. Param 252 Enable/disable Lock Configuration doesn't show (DSC-18103)

    switch (vid.commandClass) {
        // Basic offers get,set,duration,restorePrevious which make no sense on (multi)-sensors
        // and power meters. Since other command-classes provide more specific capabilities Basic is ignored.
        case CommandClasses.Basic: {
            return undefined
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
        case CommandClasses["Window Covering"]: {
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
        case CommandClasses["Color Switch"]:
        case CommandClasses["Configuration"]:
        case CommandClasses["Generic Schedule"]:
        case CommandClasses["Humidity Control Setpoint"] :
        case CommandClasses["Irrigation"]:
        case CommandClasses["Meter Table Configuration"]:
        case CommandClasses["Meter Table Push Configuration"]:
        case CommandClasses["Schedule"]:

        case CommandClasses["Thermostat Fan Mode"]:
        case CommandClasses["Thermostat Mode"] :
        case CommandClasses["Thermostat Setpoint"]:
        case CommandClasses["Thermostat Setback"]:
        case CommandClasses["Tariff Table Configuration"]:
        case CommandClasses["User Code"]: {
            return vidMeta.writeable ? "config" : "attr"
        }

        // Reduce nr of Scene Actuator Configurations
        // ignore all scene configuration for scenes 10-255 to reduce the amount of unused properties
        // tbd: convert 255 scene's to a map?
        // Note that the DSC18103 is a binary switch while still sending level and dimming duration VIDs
        // configuration report command: CC=Scene Actuator Configuration
        //                               Command = SCENE_ACTUATOR_CONF_REPORT    <- Where can this be found?
        // TODO: ignore dimming-duration if this is 0 as per doc:
        //  "supporting actuator nodes without duration capabilities MUST ignore this found and should set it to 0"
        //  0 means instantly; 1-127 in 1-second resolution; 128-254  in 1 minute resolution (1-127 minutes)
        case CommandClasses["Scene Controller Configuration"]:   // 1..255 scene IDs
        case  CommandClasses["Scene Actuator Configuration"]: {
            if (vid.property == "dimmingDuration" || vid.property == "level") {
                if (vid.propertyKey && vid.propertyKey > MaxNrScenes) {
                    return undefined;
                }
            }
            return "config"
        }

        case CommandClasses["Wake Up"]: {
            // wakeup interval is config, wakeup report is attr, wakeup notification is event
            // FIXME: determine if this is a wakeup notification (event)
            return vidMeta.writeable ? "config" : "attr"
        }

        //--- deprecated CCs
        case CommandClasses["All Switch"]:  //
        case CommandClasses["Application Capability"]:  // obsolete
        case CommandClasses["Alarm Sensor"]:  // nodes also have Notification CC
        {
            return undefined
        }
    }

    if (!vidMeta.readable) {
        return vidMeta.writeable ? "action" : "event"
    }
    if (vidMeta.writeable) {
        return "config"
    }
    return "attr"
}
