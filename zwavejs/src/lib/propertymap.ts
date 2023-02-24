// Map of property names to HiveOT vocabulary

import * as vocab from "./vocabulary.js"

// map of standardize zwave property/event/action names from various devices to HiveOT vocabulary
type PropKV = {
    [key: string]: string
}
export const PropNameMap: PropKV = {
    "alarmType": vocab.VocabAlarmType,
    "alarmLevel": vocab.VocabAlarmState,
    "Any": vocab.VocabValue,
    // "Battery load status": vocab.
    "Battery level status": vocab.VocabBatteryLevel,
    // "Button Slide Function": vocab.
    // "controllerNodeId": vocab.
    "currentValue": vocab.VocabValue,
    "duration": vocab.VocabDuration,
    // "restorePrevious": vocab.
    //"Basic Set Level": vocab.Unknown,
    "firmwareVersions": vocab.VocabFirmwareVersion,
    "hardwareVersion": vocab.VocabHardwareVersion,
    // "isLow": vocab.
    // "level": vocab.
    // "libraryType": vocab.
    "LUX Level": vocab.VocabLuminance,
    // "manufacturerId": vocab.
    // "On-Off Duration": vocab.
    // "productType": vocab.
    // "productId": vocab.
    // "Power Management": vocab.
    // "protocolVersion": vocab.
    // "Re-trigger Interval Setting": vocab.
    // "scene": vocab.
    // "Sensor Detection Function": vocab.
    // "Sensitivity Level": vocab.
    // "slowRefresh"
    // "Touch Sound": vocab.
    // "Touch Vibration": vocab.
    // "wakeUpInterval": vocab.
}
