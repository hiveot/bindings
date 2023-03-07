// Map of property names to HiveOT vocabulary

import * as vocab from "./vocabulary.js"

// map of standardize zwave property/event/action names from various devices to HiveOT vocabulary
type PropKV = {
    [key: string]: string
}


export const EventTypeMap: PropKV = {
    "alarmLevel": vocab.EventTypeAlarm,
    "Any": vocab.EventTypeValue,
    "currentValue": vocab.EventTypeValue, // any value
    "isLow": vocab.EventTypeLowBattery,
    "LUX Level": vocab.EventTypeLuminance,
    // Meter
    "value-Electric_A_Consumed": vocab.EventTypeCurrent,
    "value-Electric_V_Consumed": vocab.EventTypeVoltage,
    "value-Electric_W_Consumed": vocab.EventTypePower,
    "value-Electric_kWh_Consumed": vocab.EventTypeEnergy,
}
export const PropNameMap: PropKV = {
    "alarmType": vocab.PropTypes.AlarmType,
    // "alive" : vocab.Status,
    "Battery level status": vocab.PropTypes.BatteryLevel,
    // "Button Slide Function": vocab.
    // "duration": vocab.VocabDuration,
    "firmwareVersions": vocab.PropTypes.FirmwareVersion,
    "hardwareVersion": vocab.PropTypes.HardwareVersion,
    "manufacturer": vocab.PropTypes.Manufacturer,
    "ping" : vocab.ManageTypePing,
    // "productType": vocab.
    // "productId": vocab.
    // "reset": vocab.PropTypeReset,
    "refreshInfo": vocab.ManageTypeRefresh,
    "reset" : vocab.ManageTypeReset,
    // "scene": vocab.
    // "Sensitivity Level": vocab.
    "softwareVersion": vocab.PropTypes.SoftwareVersion,
}
