// Map of property names to HiveOT vocabulary

import * as vocab from "../lib/vocabulary.js"
import {ActionTypes} from "../lib/vocabulary.js";

// map of standardize zwave property/event/action names from various devices to HiveOT vocabulary
type ActionTypeMap = {[s:string]: (stringID: string, args: any) => void }

// Actions map to handlers that know how to speak zwavejs
export const actionTypeMap: ActionTypeMap = {
    Lock:     handleActionTypeLock,      // [bool] door lock (true, false)
    Mute:     handleActionTypeMute,      // [bool] av mute
    On:       handleActionTypeOn,        // [number] set lights on/off value (0..100)
    Open:     handleActionTypeOpen,      // [number] set open/close value (0..100)
    Play:     handleActionTypePlay,      // [bool] av play/pause
    SetValue: handleActionTypeSetValue,  // [number] set a value
    Volume:    handleActionTypeVolume,   // [number] av set volume 0-100%
}

function handleActionTypeLock(thingID:string, args:any) {
}

function handleActionTypeMute(thingID:string, args:any) {
}

function handleActionTypeOn(thingID:string, args:any) {
}
function handleActionTypeOpen(thingID:string, args:any) {
}
function handleActionTypePlay(thingID:string, args:any) {
}
function handleActionTypeSetValue(thingID:string, args:any) {
}
function handleActionTypeVolume(thingID:string, args:any) {
}