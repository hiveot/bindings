import {
  Driver, HealNodeStatus,
  InclusionResult,
  NodeStatistics,
  NodeStatus,
  TranslatedValueID, ValueMetadataNumeric, ValueMetadataString,
  ZWaveNode,
  ZWaveNodeMetadataUpdatedArgs,
  ZWaveNodeValueAddedArgs,
  ZWaveNodeValueNotificationArgs,
  ZWaveNodeValueRemovedArgs,
  ZWaveNodeValueUpdatedArgs,
} from "zwave-js";
import md5 from "md5";
import type {ValueMetadataBuffer} from "@zwave-js/core";
const DefaultNetworkPassword = "My name is groot";

// ZWAPI is a wrapper around zwave-js for use by the HiveOT binding.
// Its primary purpose is to hide the ZWave specific logic from the binding; offer a simple API to
// obtain the data for publishing the node TDs and events; and accept actions for devices.
// To do so it transforms ZWave vocabulary to HiveOT vocabulary.
export class ZWAPI {
  // driver initializes on connect
  driver!: Driver;

  // callback to notify of a change in node state
  onStateUpdate: (node: ZWaveNode, newState: string) => void;

  // callback to notify of a change in node VID or metadata
  onNodeUpdate: (node: ZWaveNode) => void;

  // callback to notify of a change in VID value
  onValueUpdate: (node: ZWaveNode, v: TranslatedValueID, newValue: any) => void;

  // discovered nodes
  nodes: Map<string, ZWaveNode>;

  firmwareUpdateState: string|undefined = undefined;
  healNetworkState: string|undefined = undefined;
  inclusionState: string|undefined = undefined;

  constructor(
      // handler for node VID or Metadata updates
    onNodeUpdate: (node: ZWaveNode) => void,
      // handler for node property value updates
    onValueUpdate: (node: ZWaveNode, v: TranslatedValueID, newValue: any) => void,
    // handler for node state updates
    onStateUpdate: (node: ZWaveNode, newState: string) => void) {

    this.onStateUpdate = onStateUpdate;
    this.onNodeUpdate = onNodeUpdate;
    this.onValueUpdate = onValueUpdate;
    this.nodes = new Map<string, ZWaveNode>();
  }

  // Add a known node and subscribe to its ready event before doing anything else
  addNode(node: ZWaveNode) {
    console.info(`Node ${node.id} - waiting for it to be ready`)
    node.on("ready", (node) => {
      console.info("--- Node", node.id, "is ready. Setting up the node.");
      this.setupNode(node);
    });
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
    // FIXME: these security keys are manually generated. They should be obtained from config
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
    this.driver.on("error", (e) => {
      this.handleDriverError(e);
    });

    // Listen for the driver ready event before doing anything with the driver
    this.driver.once("driver ready", () => {
      this.handleDriverReady()
    });

    await this.driver.start();
  }

  // disconnect from the ZWave controller
  async disconnect() {
    if (this.driver) {
      await this.driver.destroy();
    }
  }

  // // return the deviceID for the given Node
  // getDeviceID(node: ZWaveNode): string {
  //   return getDeviceID(this.driver, node)
  // }

  // Create the unique device ID for publishing
  getDeviceID(nodeID: number): string {
    let deviceID: string = this.homeID + "." + nodeID.toString();
    return deviceID
  }

  // return the node for the given ID
  getNode(nodeID: number): ZWaveNode | undefined {
    let node = this.driver.controller.nodes.get(nodeID)
    return node
  }

  // return the map of discovered ZWave nodes
  // getNodes(): ReadonlyThrowingMap<number, ZWaveNode> {
  //   return this.driver.controller.nodes
  // }


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

    // controller emitted events
    this.driver.controller.on("exclusion failed",() => {
      console.info("exclusion has failed");
    });
    this.driver.controller.on("exclusion started",() => {
      console.info("exclusion has started");
    });
    this.driver.controller.on("exclusion stopped",() => {
      console.info("exclusion has stopped");
    });

    this.driver.controller.on("heal network progress",
        (progress: ReadonlyMap<number, HealNodeStatus>) => {
      console.info("heal network progress:", progress);
    });
    this.driver.controller.on("heal network done",() => {
      console.info("heal network done");
    });

    this.driver.controller.on("inclusion failed",() => {
      console.info("inclusion has failed");
    });
    this.driver.controller.on("inclusion started",(secure: boolean) => {
      console.info("inclusion has started. secure=%v", secure);
    });
    this.driver.controller.on("inclusion stopped",() => {
      console.info("inclusion has stopped");
    });

    this.driver.controller.on("node added", (node: ZWaveNode, result: InclusionResult) => {
      result.lowSecurity
      console.info(`new node added: nodeId=${node.id} lowSecurity=${result.lowSecurity}`)
      this.setupNode(node);
    });
    this.driver.controller.on("node removed", (node: ZWaveNode, replaced: boolean) => {
      console.info(`node removed: id=${node.id}, replaced=${replaced}`);
    });

  }


  // return the homeID of the driver
  // This returns the homeID as hex string
  get homeID(): string {
    let hid = this.driver.controller.homeId;
    let homeIDStr = hid?.toString(16).toUpperCase() || "n/a"
    return homeIDStr
  }

  // setup a new node after it is ready
  setupNode(node: ZWaveNode) {
    // first time publish node TD and value map
    this.onNodeUpdate?.(node);

    node.on("alive", (node: ZWaveNode, oldStatus: NodeStatus)=>{
      console.info(`Node ${node.id}: is alive`);
      if (node.status != oldStatus) {
        this.onStateUpdate(node, "alive")
      }
    });
    node.on("dead", (node: ZWaveNode, oldStatus: NodeStatus)=>{
      console.info(`Node ${node.id}: is dead`);
      if (node.status != oldStatus) {
        this.onStateUpdate(node, "dead")
      }
    });

    node.on("interview completed", (node: ZWaveNode)=> {
      console.info(`Node ${node.id}: interview completed`);
      // event
      this.onStateUpdate(node, "interview completed")
    });
    node.on("interview failed", (node: ZWaveNode)=> {
      console.info(`Node ${node.id}: interview failed`);
      this.onStateUpdate(node, "interview failed")
    });
    node.on("interview started", (node: ZWaveNode)=> {
      console.info(`Node ${node.id}: interview started`);
      this.onStateUpdate(node, "interview started")
    });

    node.on("metadata updated", (node: ZWaveNode, args: ZWaveNodeMetadataUpdatedArgs) => {
      // FIXME: this is invoked event when metadata isn't updated. What to do?
      // this.onNodeUpdate(node)
      let newValue = node.getValue(args)
      this.onValueUpdate(node, args, newValue)
      console.info(`Node ${node.id} value metadata updated. ${args.metadata}`);
    });

    node.on("notification", (node, cc, args) => {
      console.info(`Node ${node.id} Notification: CC=${cc}, args=${args}`)
      // TODO: what/when is this notification providing?
    });

    node.on("sleep", (node: ZWaveNode)=> {
      console.info(`Node ${node.id}: is sleeping`);
      this.onStateUpdate(node, "sleeping")
    });

    node.on("statistics updated", (node: ZWaveNode, args: NodeStatistics) => {
      // console.info("Node ", node.id, " stats updated: args=", args);
    });

    node.on("value added", (node: ZWaveNode, args: ZWaveNodeValueAddedArgs) => {
      // FIXME: update the TD
      this.onValueUpdate(node, args, args.newValue)
    });

    node.on("value notification", (node: ZWaveNode, vid: ZWaveNodeValueNotificationArgs) => {
      console.info(`Node ${node.id}, value notification: propName=${vid.propertyName}, value=${vid.value}`);
      this.onValueUpdate(node, vid, vid.value)
    });

    node.on("value removed", (node: ZWaveNode, args: ZWaveNodeValueRemovedArgs) => {
      console.info("Node ", node.id, " value removed for ", args.propertyName, ":", args.prevValue);
      this.onValueUpdate(node, args, undefined)
    });

    node.on("value updated", (node: ZWaveNode, args: ZWaveNodeValueUpdatedArgs) => {
      let vidMeta = node.getValueMetadata(args)
      console.info("Node ", node.id, " value updated: args=", args,"vidMeta=",vidMeta);
      this.onValueUpdate(node, args, args.newValue)
    });

    node.on("wake up", (node: ZWaveNode)=> {
      console.info(`Node ${node.id}: wake up`);
      this._updateNodeStatus(node);
    });
  }

  // internal update of node status
  _updateNodeStatus(node: ZWaveNode) {
    // TODO: handle as event
    if (node) {
      console.info(`Node ${node.id}: EVENT status=${node.status}`);
    }
  }
}


