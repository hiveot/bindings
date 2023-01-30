import {
  AlarmSensorCC,
  CommandClass,
  Driver,
  InclusionResult,
  NodeStatistics,
  NodeStatus,
  TranslatedValueID,
  ValueMetadata,
  ValueMetadataNumeric,
  ValueMetadataString,
  ZWaveNode,
  ZWaveNodeMetadataUpdatedArgs,
  ZWaveNodeValueAddedArgs,
  ZWaveNodeValueNotificationArgs,
  ZWaveNodeValueNotificationCallback,
  ZWaveNodeValueRemovedArgs,
  ZWaveNodeValueUpdatedArgs,
  ZWaveNotificationCallback,
  ZWaveNotificationCallbackArgs_NotificationCC,
  ZWaveOptions,
} from "zwave-js";
import md5 from "md5";
import type { ConfigManager } from "@zwave-js/config";
import type { CommandClasses } from "@zwave-js/core";
import type { ReadonlyThrowingMap } from "@zwave-js/shared";
import { ValueMap } from "./valueMap";
import { getDeviceID } from "./parseNode";
import { stringify } from "querystring";
const DefaultNetworkPassword = "My name is groot";

// ZWAPI is a wrapper around zwave-js for use by the HiveOT binding.
// Its primary purpose is to hide the ZWave specific logic from the binding; offer a simple API to
// obtain the data for publishing the node TDs and events; and accept actions for devices.
// To do so it transforms zwave vocabulary to HiveOT vocabulary.
export class ZWAPI {
  // driver initializes on connect
  driver!: Driver;
  onNodeUpdate: (node: ZWaveNode) => void;
  onValueUpdate: (node: ZWaveNode, v: TranslatedValueID, newValue: any) => void;
  // discovered nodes
  nodes: Map<string, ZWaveNode>;

  constructor(
    onNodeUpdate: (node: ZWaveNode) => void,
    onValueUpdate: (node: ZWaveNode, v: TranslatedValueID, newValue: any) => void) {
    this.onNodeUpdate = onNodeUpdate;
    this.onValueUpdate = onValueUpdate;
    this.nodes = new Map<string, ZWaveNode>();
  }

  // connect initializes the zwave-js driver and connect it to the ZWave controller.
  // @remarks
  // Connect does not end until disconnect is called..
  //
  // @param port device to use or "" to auto discover
  // @param enableSIS
  // @param keys .. tbd
  // @param onReady
  // @param onNodeUpdate
  async connect() {
    // TODO: these security keys are manually generated. They should be obtained from config
    // or generated at a new install.
    let legacyKey = md5(DefaultNetworkPassword);
    let options = {
      securityKeys: {
        // These keys are generated with "< /dev/urandom tr -dc A-F0-9 | head -c32 ;echo"
        S2_Unauthenticated: Buffer.from("1B455E0AE8724577D88C26B39E0504AC", "hex"),
        S2_Authenticated: Buffer.from("C67D1268B66A822D2EA9C026B6E89EE6", "hex"),
        S2_AccessControl: Buffer.from("9F7571802DB6B61BF0AD78649E78CE2E", "hex"),
        // S0_Legacy replaces the old networkKey option
        S0_Legacy: Buffer.from("0102030405060708090a0b0c0d0e0f10", "hex"),
        //  "3919ac57ecb692d7a84e36f39196f765")
        // S0_Legacy: Buffer.from(legacyKey, "hex"),
      },
      // wait for the device verification before sending value updated event.
      //  instead some kind of 'pending' status should be tracked.
      emitValueUpdateAfterSetValue: false,
      //
      logConfig: {
        enabled: true,
        level: "http",
        // logToFile: true,
      },
      // storage: {
      // allow for a different cache directory
      // cacheDir: "config/zwavejs",
      // },
    };

    // Start the driver. To await this method, put this line into an async method
    // TODO: take port from config
    // TODO: auto-detect port if no config is provided
    // TODO: sleeping nodes should not block other nodes from using (all nodes ready event)
    this.driver = new Driver("/dev/ttyACM0", options);

    // You must add a handler for the error event before starting the driver
    this.driver.on("error", (e) => this.handleDriverError(e));

    // Listen for the driver ready event before doing anything with the driver
    this.driver.once("driver ready", () => this.handleDriverReady());

    await this.driver.start();
  }

  // disconnect from the ZWave controller
  async disconnect() {
    await this.driver.destroy();
  }

  // // return the deviceID for the given Node
  // getDeviceID(node: ZWaveNode): string {
  //   return getDeviceID(this.driver, node)
  // }

  // return the homeID of the driver
  // This returns the homeID as hex string
  get homeID(): string {
    let hid = this.driver.controller.homeId;
    let homeIDStr = hid?.toString(16).toUpperCase() || "n/a"
    return homeIDStr
  }

  // return the node for the given ID
  getNode(nodeID: number): ZWaveNode | undefined {
    let node = this.driver.controller.nodes.get(nodeID)
    return node
  }

  // return the map of discovered ZWave nodes
  getNodes(): ReadonlyThrowingMap<number, ZWaveNode> {
    return this.driver.controller.nodes
  }


  // Driver reports and error
  handleDriverError(e: Error) {
    // TODO: what do we want to do with errors?
    // 1: count them to display as a driver property
    // 2: establish node health
    console.error(e);
  }

  // Driver is ready.
  handleDriverReady() {

    /*
      Now the controller interview is complete. This means we know which nodes
      are included in the network, but they might not be ready yet.
      The node interview will continue in the background.
      */
    let ctl = this.driver.controller;
    // homeID is ready after the controller interview
    // this.homeID = ctl.homeId ? ctl.homeId.toString(16).toUpperCase() : "n/a";

    console.info("Cache Dir: ", this.driver.cacheDir);
    console.info("Home ID:   ", this.driver.controller.homeId?.toString(16));

    ctl.nodes.forEach((node) => {
      // Subscribe to each node to catch its ready event.
      this.addNode(node);
    });

    this.driver.controller.on("node added", (node: ZWaveNode, result: InclusionResult) => {
      console.info("new node added: id: ", node.id, ", productID:", node.productId, " config: ", node.deviceConfig);
      this.setupNode(node);
    });
    this.driver.controller.on("node removed", (node: ZWaveNode, replaced: boolean) => {
      console.info("node removed: id: ", node.id);
    });

  }


  // Add a known node and subscribe to its ready event before doing anything else
  addNode(node: ZWaveNode) {
    console.info(`Node ${node.id} - waiting for it to be ready`)
    node.on("ready", (node) => {
      console.info("--- Node", node.id, "is ready. Setting up the node.");
      this.setupNode(node);
    });
  }

  // setup a new node after it is ready
  setupNode(node: ZWaveNode) {
    // first time publish node TD and value map
    this.onNodeUpdate?.(node);

    node.on("alive", this.handleNodeAlive.bind(this));
    node.on("dead", this.handleNodeDead.bind(this));
    node.on("interview started", this.handleNodeInterviewStarted.bind(this));
    node.on("interview completed", this.handleNodeInterviewCompleted.bind(this));
    node.on("interview failed", this.handleNodeInterviewFailed.bind(this));
    node.on("metadata updated", this.handleNodeMetadataUpdated.bind(this));
    node.on("notification", (node, cc, args) => this.handleNodeNotification.bind(this)(node, cc, args));
    // node.on("ready", this.handleNodeReady.bind(this))
    node.on("sleep", this.handleNodeSleep.bind(this));
    node.on("statistics updated", this.handleNodeStatisticsUpdated.bind(this));
    node.on("value added", this.handleValueAdded.bind(this));
    // node.on("value notification", (node, args) => this.handleValueNotification(node, args));
    node.on("value notification", this.handleValueNotification.bind(this));
    node.on("value removed", this.handleValueRemoved.bind(this));
    node.on("value updated", this.handleValueUpdated.bind(this));
    node.on("wake up", this.handleNodeWakeUp.bind(this));

    //

  }
  handleNodeAlive(node: ZWaveNode, oldStatus: NodeStatus) {
    console.info(`Node ${node.id}: is alive`);
  }
  handleNodeDead(node: ZWaveNode, oldStatus: NodeStatus) {
    console.info(`Node ${node.id}: is dead`);
  }
  handleNodeInterviewCompleted(node: ZWaveNode) {
    console.info(`Node ${node.id}: interview completed`);
    this._updateNodeStatus(node);
  }
  handleNodeInterviewFailed(node: ZWaveNode) {
    console.error(`Node ${node.id}: interview failed`);
    this._updateNodeStatus(node);
  }
  handleNodeInterviewStarted(node: ZWaveNode) {
    console.info(`Node ${node.id}: interview started`);
    this._updateNodeStatus(node);
  }
  handleNodeMetadataUpdated(node: ZWaveNode, args: ZWaveNodeMetadataUpdatedArgs) {
    // isnt this a value update? No
    let val = node.getValue(args)
    console.info(`Node ${node.id} value metadata updated for ${args.propertyName}: ${val}`);
    // this._handleNodeValueUpdate(node, args, args.metadata)
  }
  // Docs: This event serves a similar purpose as the "value notification", 
  // but is used for more complex CC-specific notifications. 
  // handleNodeNotification: ZWaveNotificationCallback = () => {
  handleNodeNotification(node: ZWaveNode,
    cc: CommandClasses,
    // args: ZWaveNotificationCallbackArgs_NotificationCC) {
    args: any) {

    console.info(`Node ${node.id} Notification: CC=${cc}, args=${args}`)
    // TODO: what/when is this notification providing?
  }

  handleNodeSleep(node: ZWaveNode) {
    console.info(`Node ${node.id}: is sleeping`);
    this._updateNodeStatus(node);
  }
  handleNodeWakeUp(node: ZWaveNode) {
    console.info(`Node ${node.id}: is awake`);
    this._updateNodeStatus(node);
  }
  handleValueAdded(node: ZWaveNode, args: ZWaveNodeValueAddedArgs) {
    // console.info("Node ", node.id, " value added for ", args.propertyName, ": ", args.newValue);
    this.onValueUpdate(node, args, args.newValue)
  }
  handleValueNotification(node: ZWaveNode, vid: ZWaveNodeValueNotificationArgs) {
    this.onValueUpdate(node, vid, vid.value)
  }
  handleValueRemoved(node: ZWaveNode, args: ZWaveNodeValueRemovedArgs) {
    console.info("Node ", node.id, " value removed for ", args.propertyName, ":", args.prevValue);
  }
  handleValueUpdated(node: ZWaveNode, args: ZWaveNodeValueUpdatedArgs) {
    this.onValueUpdate(node, args, args.newValue)
  }
  handleNodeStatisticsUpdated(node: ZWaveNode, args: NodeStatistics) {
    console.info("Node ", node.id, " stats updated: args=", args);
  }

  _updateNodeStatus(node: ZWaveNode) {
    // TODO: handle as event
    if (node) {
      console.info(`Node ${node.id}: EVENT status=${node.status}`);
    }
  }
}


