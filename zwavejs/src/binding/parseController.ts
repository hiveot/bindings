import type {ZWaveController} from "zwave-js";
import type {ThingTD} from "../lib/thing";
import {DataType, } from "../lib/vocabulary";
import {getEnumMemberName, RFRegion} from "zwave-js";
import {InterviewStage} from "@zwave-js/core";

// parseController adds controller actions and attributes to the Thing
export function parseController(td: ThingTD, ctl:ZWaveController)  {
    td.AddProperty("sdkVersion", "Z-Wave SDK version supported by the controller hardware", DataType.String, ctl.sdkVersion);
    td.AddProperty("homeID", "Z-Wave SDK version supported by the controller hardware", DataType.Number, ctl.homeId);

    if (ctl.rfRegion) {
        let prop = td.AddProperty("rfRegion", "RF Region the controller is set to", DataType.Number, ctl.rfRegion);
        prop.readOnly = false // this is a configuration
        // TBD: should enum numbers be used?
        prop.enum = ["Europe", "USA", "Australia/New Zealand", "Hong Kong", "India", "Israel", "China", "Japan", "Korea", "Unknown", "Default (EU)"]
        let rfRegionName = getEnumMemberName(RFRegion, ctl.rfRegion)
        td.AddProperty("rfRegionName", "RF Region the controller is set to", DataType.String, rfRegionName);
    }

    // controller events. Note these must match the controller event handler
    td.AddEvent("healNetworkState", "Heal Network Progress", DataType.String);
    td.AddEvent("inclusionState", "Node Inclusion Progress", DataType.String);
    // td.AddEvent("firmwareUpdateState", "Firmware Update Progress", DataType.String);

    // controller actions FIXME: implement
    td.AddEvent("nodeAdded", "Node Added", DataType.Number);
    td.AddEvent("nodeRemoved", "Node Removed", DataType.Number);
    td.AddEvent("nodeNeighbors", "Update of the  neighbors list", DataType.Array); // array of node ids

    // controller network actions FIXME: implement
    td.AddAction("beginInclusion", "Start the default inclusion process for new nodes. Prefer S2 security if supported", DataType.Unknown)
    td.AddAction("stopInclusion", "Stop the inclusion process", DataType.Unknown)
    td.AddAction("beginExclusion", "Start the node exclusion process for node removal", DataType.Unknown)
    td.AddAction("stopExclusion", "Stop the node exclusion process", DataType.Unknown)
    td.AddAction("beginHealingNetwork", "Start healing the network routes. This can take a long time and slow things down.", DataType.Unknown)
    td.AddAction("stopHealingNetwork", "Stop on ongoing healing process", DataType.Unknown)

    // controller node actions // FIXME: implement
    td.AddAction("getNodeNeighbors", "Request update to a node's neighbor list (thingID)", DataType.String)
    td.AddAction("healNode", "Heal the node and update its neighbor list (thingID)", DataType.String)
    td.AddAction("removeFailedNode", "Remove a failed node from the network (thingID)", DataType.String)
    // td.AddAction("replaceFailedNode", "Replace a failed node with another node (thingID, thingID)", DataType.String)
}
