// Definition of the Thing's TD, Thing Description document
// This consists of the TD itself with properties

import { DataType } from "./vocabulary.js"

export class DataSchema extends Object {
    // Used to indicate input, output, attribute. See vocab.WoSTAtType
    public "@type": string | undefined

    // Provides a default value of any type as per data schema
    public default: string | undefined

    // Provides additional (human-readable) information based on a default language
    public description: string | undefined
    // Provides additional nulti-language information
    public descriptions: string[] | undefined = undefined

    // Restricted set of values provided as an array.
    //  for example: ["option1", "option2"]
    public enum: any[] | undefined = undefined


    // number maximum value
    public maximum: number | undefined = undefined

    // maximum nr of items in array
    public maxItems: number | undefined = undefined

    // string maximum length
    public maxLength: number | undefined = undefined

    // number minimum value
    public minimum: number | undefined = undefined

    // minimum nr of items in array
    public minItems: number | undefined = undefined

    // string minimum length
    public minLength: number | undefined = undefined

    // Boolean value to indicate whether a property interaction / value is read-only (=true) or not (=false)
    // the value true implies read-only.
    public readOnly: boolean = true

    // Human readable title in the default language
    public title: string | undefined
    // Human readable titles in additional languages
    public titles: string[] | undefined = undefined

    // Type provides JSON based data type,  one of DataTypeNumber, ...object, array, string, integer, boolean or null
    public type: DataType = DataType.Unknown

    // See vocab UnitNameXyz for units in the WoST vocabulary
    public unit: string | undefined = undefined

    // Boolean value to indicate whether a property interaction / value is write-only (=true) or not (=false)
    public writeOnly: boolean = false

}

// Form describing supported protocol binding operations
export class TDForm extends Object {
    public href: string = ""
    public op: string = ""
    public contentType: string = "application/json"
}

export class InteractionAffordance extends Object {
    // Unique name of the affordance, eg: property, event or action name
    // While not part of the official specification, it allows passing the affordance
    // without having to separately pass a name.
    name: string = ""

    // Provides additional (human-readable) information based on a default language
    public description: string | undefined
    // Provides additional nulti-language information
    public descriptions: string[] | undefined = undefined

    // Form hypermedia controls to describe how an operation can be performed
    // Forms are serializations of Protocol Bindings.
    public forms: TDForm[] | undefined = undefined

    // Human readable title in the default language
    public title: string | undefined
    // Human readable titles in additional languages
    public titles: string[] | undefined = undefined

}

/** Thing Description Action Affordance
 */
export class ActionAffordance extends InteractionAffordance {
    /**
     * Input data for the action when applicable
     */
    public input?: DataSchema = new DataSchema()

    /**
     * Action is idempotent, eg repeated calls have the same result
     */
    public idempotent: boolean = false

    // // action input parameters
    // public inputs = new Map<string, {
    //   WoTDataType?: string,
    //   WoTProperties?: Map<string, string>,
    //   WoTRequired?: boolean,
    // }>()
}

/** Thing Description Event Affordance
 */
export class EventAffordance extends InteractionAffordance {
    // Data schema of the event instance message, eg the event payload
    public data: DataSchema | undefined = undefined
}

/** Thing Description property affordance
 * The specification says this is an interaction affordance that is also a data schema?
 * JS doesn't support multiple inheritance so we'll use a dataschema and add the missing
 * 'forms' field from the interaction affordance. 
 */
export class PropertyAffordance extends DataSchema {

    // property name is assigned the property name to be able to use in an array for presentation
    name: string = ""

    // Form hypermedia controls to describe how an operation can be performed
    // Forms are serializations of Protocol Bindings.
    // In WoST properties do not have individual protocol bindings for their operations
    // so this is empty (why is it mandatory?)
    public forms: TDForm[] | undefined = undefined

    // Optional nested properties. Map with PropertyAffordance
    // used when a property has multiple instances, each with their own name
    public properties: Map<string, PropertyAffordance> | undefined = undefined
}


/** Thing description document
 */
export class ThingTD extends Object {

    /**
     * Create a new instance of Thing Description document
     * 
     * @param deviceID thingID of this device
     * @param deviceType one of vocabulary's DeviceTypeXyz
     * @param title human readable title (name) of the device
     * @param publisherID thingID of the publisher of this device
     */
    constructor(deviceID: string, publisherID: string, deviceType: string, title: string, description: string) {
        super();
        this.id = deviceID;
        this.publisherID = publisherID;
        this["@type"] = deviceType;
        this.title = title;
        this.description = description;
        this.created = new Date().toISOString();
        this.modified = this.created;
    }

    /** Unique thing ID */
    public readonly id: string | undefined = "";

    /** Publisher deviceID of the binding that is publishing this thing */
    public publisherID: string = "";

    /** Document creation date in ISO8601 */
    public created: string = "";

    /** Document modification date in ISO8601 */
    public modified: string = "";

    /** Human description for a thing */
    public description: string = "";

    /** Human readable title for ui representation */
    public title: string = "";

    /** Type of thing defined in the vocabulary */
    public "@type": string = "";

    /**
     * Collection of properties of a thing 
     * @param key see WoST vocabulary PropNameXxx
     */
    public readonly properties: { [key: string]: PropertyAffordance } = {};

    /** Collection of actions of a thing */
    public readonly actions: { [key: string]: ActionAffordance } = {};

    /** Collection of events (outputs) of a thing */
    public readonly events: { [key: string]: EventAffordance } = {};


    // AddAction provides a simple way to add an action to the TD
    // This returns the action affordance that can be augmented/modified directly
    //
    // @param name is the name under which it is stored in the action map.
    // @param title is the title used in the action. Leave empty to use name.
    // @param dataType is the type of data the action holds, DataTypeNumber, ..Object, ..Array, ..String, ..Integer, ..Boolean or null
    AddAction(name: string, title: string | undefined, dataType: DataType): ActionAffordance {
        let action = new ActionAffordance()
        action.name = name;
        action.input = new DataSchema();
        action.title = title ? title : name;
        this.actions[name] = action;

        action.input.title = title;
        action.input.type = dataType;
        return action
    }
    // AddProperty provides a simple way to add a Thing property to the TD
    // This returns the property affordance that can be augmented/modified directly
    // By default this property is read-only. (eg an attribute)
    //
    // @param name is the name under which it is stored in the property affordance map.
    // @param title is the title used in the property. Leave empty to use the name.
    // @param dataType is the type of data the property holds, WoTDataTypeNumber, ..Object, ..Array, ..String, ..Integer, ..Boolean or null
    AddProperty(name: string, title: string | undefined, dataType: DataType): PropertyAffordance {
        let prop = new PropertyAffordance()
        prop.name = name;
        prop.type = dataType;
        prop.title = title ? title : name;
        prop.readOnly = true;
        this.properties[name] = prop;
        return prop
    }

    // AddPropertyIf only adds the property if the first parameter is not undefined 
    //
    // @param ifNotUndefined add the attribute if not undefined
    // @param name is the name under which it is stored in the property affordance map.
    // @param title is the title used in the property. Leave empty to use the name.
    // @param dataType is the type of data the property holds, DataTypeNumber, ..Object, ..Array, ..String, ..Integer, ..Boolean or null
    AddPropertyIf(ifNotUndefined: any, name: string, title: string | undefined, dataType: DataType): PropertyAffordance | undefined {
        if (ifNotUndefined != undefined) {
            let prop = new PropertyAffordance()
            prop.name = name;
            prop.type = dataType;
            prop.title = title ? title : name;
            prop.readOnly = true;
            this.properties[name] = prop;
            return prop
        }
        return undefined
    }


    // Convert the actions map into an array for display
    public static GetThingActions = (td: ThingTD): Array<ActionAffordance> => {
        let res = new Array<ActionAffordance>()
        if (!!td && !!td.actions) {
            for (let [key, val] of Object.entries(td.actions)) {
                res.push(val)
            }
        }
        let isArray = res instanceof (Array)
        console.log("isArray:", isArray)
        return res
    }


    // AddEvent provides a simple way to add an event definition to the TD.
    // This returns the event affordance that can be augmented/modified directly.
    //
    // @param name is the name under which it is stored in the event map.
    // @param title is the title used in the property. Leave empty to use name.
    // @param dataType is the type of data the property holds, WoTDataTypeNumber, ..Object, ..Array, ..String, ..Integer, ..Boolean or null
    AddEvent(name: string, title: string | undefined, dataType: DataType): EventAffordance {
        let ev = new EventAffordance()
        ev.name = name;
        ev.data = new DataSchema();
        ev.data.title = title
        ev.data.type = dataType;
        ev.title = title ? title : name;
        this.events[name] = ev;
        return ev
    }
    // Convert readonly properties into an array for display
    // Returns table of {key, tdproperty}
    // public static GetThingAttributes = (td: ThingTD): PropertyAffordance[] => {
    //   let res = Array<PropertyAffordance>()
    //   if (!!td && !!td.properties) {
    //     for (let [key, val] of Object.entries(td.properties)) {
    //       if (val.readOnly) {
    //         res.push(val)
    //       }
    //     }
    //   }
    //   return res
    // }
    // Convert readonly properties into an array for display
    // Returns table of {key, tdproperty}
    public static GetAttributeNames = (td: ThingTD): string[] => {
        let res = Array<string>()
        if (!!td && !!td.properties) {
            for (let [key, val] of Object.entries(td.properties)) {
                if (val.readOnly) {
                    res.push(key)
                }
            }
        }
        return res
    }
    // // Convert the writable properties into an array for display
    // // Returns table of {key, tdproperty}
    // public static GetThingConfiguration = (td: ThingTD): PropertyAffordance[] => {
    //   let res = Array<PropertyAffordance>()
    //   if (!!td && !!td.properties) {
    //     for (let [key, val] of Object.entries(td.properties)) {
    //       if (!val.readOnly) {
    //         res.push(val)
    //       }
    //     }
    //   }
    //   return res
    // }

    // Returns names of configuration properties
    public static GetConfigurationNames = (td: ThingTD): string[] => {
        let res = Array<string>()
        if (!!td && !!td.properties) {
            for (let [key, val] of Object.entries(td.properties)) {
                if (!val.readOnly) {
                    res.push(key)
                }
            }
        }
        return res
    }

    public static GetThingEvents = (td: ThingTD): Array<EventAffordance> => {
        let res = Array<EventAffordance>()
        if (!!td && !!td.events) {
            for (let [key, val] of Object.entries(td.events)) {
                res.push(val)
            }
        }
        return res
    }


    // Return the TD property with the given ID
    public static GetThingProperty = (td: ThingTD, propID: string): PropertyAffordance | undefined => {
        let tdProp: PropertyAffordance | undefined = undefined
        if (!!td && !!td.properties) {
            tdProp = td.properties[propID]
        }
        return tdProp
    }

}
