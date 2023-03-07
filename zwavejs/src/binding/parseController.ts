import type {ZWaveController} from "zwave-js";
import {RFRegion} from "zwave-js";
import type {ThingTD} from "../lib/thing.js";
import {DataSchema} from "../lib/thing.js";
import {DataType,} from "../lib/vocabulary.js";

// parseController adds controller actions and attributes to the Thing
export function parseController(td: ThingTD, ctl:ZWaveController)  {
    // td.AddProperty("sdkVersion", "Z-Wave SDK version", DataType.String, ctl.sdkVersion.toString());
    // td.AddProperty("homeID", "Network ID", DataType.Number, ctl.homeId.toString());

    if (ctl.rfRegion) {
        td.AddProperty("rfRegion", "","RF Region", DataType.String)
            .SetAsEnum(RFRegion, ctl.rfRegion)
            .SetAsConfiguration()
            .SetDescription("RF Region the controller is set to")
    }

    // controller events. Note these must match the controller event handler
    td.AddEvent("healNetworkState", "healNetworkState", "Heal Network Progress", undefined,
        new DataSchema({title: "Heal State", type: DataType.String}))
    td.AddEvent("inclusionState", "inclusionState", "Node Inclusion Progress", undefined,
        new DataSchema({title: "Inclusion State", type: DataType.String}))

    // controller actions FIXME: implement
    td.AddEvent("nodeAdded", "nodeAdded", "Node Added", undefined,
         new DataSchema({title: "ThingID", type: DataType.String}) )
    td.AddEvent("nodeRemoved", "nodeRemoved", "Node Removed", undefined,
        new DataSchema({title: "ThingID", type: DataType.String}) )

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
    td.AddAction("getNodeNeighbors", "getNodeNeighbors", "Update Neighbors",
        "Request update to a node's neighbor list",
         new DataSchema({title:"ThingID", type:DataType.String})
    )
    td.AddAction("healNode","healNode", "Heal the node",
        "Heal the node and update its neighbor list",
        new DataSchema({title:"ThingID", type:DataType.String})
    )
    td.AddAction("removeFailedNode", "removeFailedNode", "Remove failed node",
        "Remove a failed node from the network",
        new DataSchema({title:"ThingID", type:DataType.String})
    )
    // td.AddAction("replaceFailedNode", "Replace a failed node with another node (thingID, thingID)", DataType.String)
}
