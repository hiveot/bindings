// import { LinearBackoff, Websocket, WebsocketBuilder } from 'websocket-ts';
import { MessageType } from 'zwave-js';

// HiveOTPubSub is the client to publish and subscribe to the HiveOT Hub message bus.
// This uses the Hub's http protocol binding over websocket.
// Capnp is not used due to painful and incomplete support for typescript/javascript.


export interface ThingValue {
    publisherID: string

    // ThingID of the thing itself
    thingID: string

    // Name of event or action as described in the thing TD
    name: string

    // Event Value, JSON encoded
    valueJSON: string

    // Timestamp the value was created, in ISO8601 UTC format. Default "" is now()
    created: string
}



// IDevicePubSub available to an IoT device
export interface IDevicePubSub {
    // PubEvent publishes the given thing event. The payload is an event value as per TD.
    // This will combine the thingID with the device's thingID to publish it under the thing address
    //  @param thingID of the Thing whose event is published
    //  @param name is the event name
    //  @param jsonValue is the JSON serialized event value, or nil if the event has no value
    pubEvent(thingID: string, name: string, jsonValue: string): Error | undefined;


    // PubProperties publishes property values of a thing on the message bus
    //  @param thingID of the Thing whose event is published (not the thing address)
    //  @param props is a map of property {name:JSONvalue} pairs.
    pubProperties(thingID: string, props: Map<string, string>): Error | undefined;

    // PubTD publishes the given thing TD. The payload is a serialized TD document.
    // This will combine the thingID with the device's thingID to publish it under the thing address
    //  thingID of the Thing whose event is published (not the thing address)
    pubTD(thingID: string, deviceType: string, tdJSON: string): Error | undefined;

    // Release the capability and end subscriptions
    release(): void;

    // SubAction creates a topic and registers a listener for actions to things with this device.
    // This supports receiving queued messages for this gateway since it last disconnected.
    //  thingID is the ID of the Thing whose action to subscribe to, or "" for all
    //   things of the publisher.
    //  name is the action name, or "" to subscribe to all actions
    //  handler will be invoked when an action is received for this device
    subAction(thingID: string, name: string, handler: (value: ThingValue) => void): Error | undefined;
}


// implementation of the Device publish/subscribe API
export class DevicePubSubImpl implements IDevicePubSub {
    // ws: Websocket | undefined;
    subscriptions = new Array<any>

    // Connect to the hub on the given address
    // set reconnect
    connect(hubAddress: string): Error | undefined {
        // this.ws = new WebsocketBuilder(hubAddress).withBackoff(new LinearBackoff(0, 1000, 60000))
        // this.ws.onOpen = this.onOpen.bind(this)
        // this.ws.onClose = this.onClose.bind(this)
        // this.ws.onError = this.onError.bind(this)
        // this.ws.onMessage = this.onMessage.bind(this)
        // this.ws.onRetry = () => { console.info("connection retry") }
        // this.ws.build()
        return
    }

    // Disconnect from the hub
    disconnect(): void {
        // if (this.ws) {
        //     this.ws.close()
        // }
    }

    // onOpen(ws: Websocket, ev: Event): void {

    // }
    // onClose(ws: Websocket, ev: Event): void {

    // }
    // onError(ws: Websocket, ev: Event): void {

    // }
    // onMessage(ws: Websocket, ev: Event): void {
    //     let msg = JSON.parse(ev.type)
    // }



    // publish the given event
    pubEvent(thingID: string, name: string, jsonValue: string): Error | undefined {
        let msg = {
            message: "event",
            thingID: thingID,
            jsonValue: jsonValue
        }
        let msgJson = JSON.stringify(msg)
        // this.ws?.send(msgJson)
        return
    }


    // publish property map as a properties event
    pubProperties(thingID: string, props: Map<string, string>): Error | undefined {
        let msg = {
            message: "event",
            thingID: thingID,
            jsonValue: props
        }
        let msgJson = JSON.stringify(msg)
        // this.ws?.send(msgJson)
        return
    }

    // publish the TD document
    pubTD(thingID: string, deviceType: string, tdJSON: string): Error | undefined {
        let msg = {
            message: "event",
            thingID: thingID,
            jsonValue: tdJSON
        }
        let msgJson = JSON.stringify(msg)
        // this.ws?.send(msgJson)
        return
    };

    // Release the capability and end subscriptions
    release(): void {
        // if (this.ws) {
        //     this.ws?.close()
        //     this.ws = undefined
        // }
    }

    // SubAction creates a topic and registers a listener for actions to things with this device.
    // This supports receiving queued messages for this gateway since it last disconnected.
    //  thingID is the ID of the Thing whose action to subscribe to, or "" for all
    //   things of the publisher.
    //  name is the action name, or "" to subscribe to all actions
    //  handler will be invoked when an action is received for this device
    subAction(thingID: string, name: string, handler: (value: ThingValue) => void): Error | undefined {
        let sub = {
            message: "action",
            thingID: thingID,
            action: name,
            handler: handler
        }
        this.subscriptions.push(sub)
        return
    }
}

