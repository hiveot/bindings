import type {ZWaveController} from "zwave-js";
import {getEnumMemberName, RFRegion} from "zwave-js";
import type {ThingTD} from "../lib/thing.js";
import {DataSchema} from "../lib/thing.js";
import {DataType,} from "../lib/vocabulary.js";

// parseController adds controller actions and attributes to the Thing
export function parseController(td: ThingTD, ctl:ZWaveController)  {
    td.AddProperty("sdkVersion", "Z-Wave SDK version", DataType.String, ctl.sdkVersion);
    td.AddProperty("homeID", "Network ID", DataType.Number, ctl.homeId);

    if (ctl.rfRegion) {
        let prop = td.AddProperty("rfRegion", "RF Region", DataType.Number, ctl.rfRegion);
        prop.readOnly = false // this is a configuration
        // TBD: should enum numbers be used?
        prop.enum = ["Europe", "USA", "Australia/New Zealand", "Hong Kong", "India", "Israel", "China", "Japan", "Korea", "Unknown", "Default (EU)"]
        let rfRegionName = getEnumMemberName(RFRegion, ctl.rfRegion)
        td.AddProperty("rfRegionName", "RF Region the controller is set to", DataType.String, rfRegionName);
    }

    // controller events. Note these must match the controller event handler
    td.AddEvent("healNetworkState", "healNetworkState", "Heal Network Progress" )
        .data = new DataSchema({title: "Heal State", type: DataType.String})
    td.AddEvent("inclusionState", "inclusionState", "Node Inclusion Progress")
        .data = new DataSchema({title: "Inclusion State", type: DataType.String})

    // controller actions FIXME: implement
    td.AddEvent("nodeAdded", "nodeAdded", "Node Added")
        .data = new DataSchema({title: "ThingID", type: DataType.String})
    td.AddEvent("nodeRemoved", "nodeRemoved", "Node Removed")
        .data = new DataSchema({title: "ThingID", type: DataType.String})

    // controller network actions FIXME: implement
    td.AddAction("beginInclusion", "beginInclusion","Start add node process",
        "Start the inclusion process for new nodes. Prefer S2 security if supported")
    td.AddAction("stopInclusion", "stopInclusion", "Stop add node process")
    td.AddAction("beginExclusion", "beginExclusion", "Start node removal process")
    td.AddAction("stopExclusion", "stopExclusion", "Stop node removal process")
    td.AddAction("beginHealingNetwork", "beginHealingNetwork", "Start heal network process",
         "Start healing the network routes. This can take a long time and slow things down.")
    td.AddAction("stopHealingNetwork", "stopHealingNetwork", "Stop the ongoing healing process")

    // controller node actions // FIXME: implement
    td.AddAction("getNodeNeighbors", "getNodeNeighbors", "Update Neighbors", "Request update to a node's neighbor list")
        .input = new DataSchema({title:"ThingID", type:DataType.String})
    td.AddAction("healNode","healNode", "Heal the node", "Heal the node and update its neighbor list")
        .input = new DataSchema({title:"ThingID", type:DataType.String})
    td.AddAction("removeFailedNode", "removeFailedNode", "Remove failed node", "Remove a failed node from the network")
        .input = new DataSchema({title:"ThingID", type:DataType.String})
    // td.AddAction("replaceFailedNode", "Replace a failed node with another node (thingID, thingID)", DataType.String)
}
