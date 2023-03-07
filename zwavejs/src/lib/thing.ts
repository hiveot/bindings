// Definition of the Thing's TD, Thing Description document
// This consists of the TD itself with properties

import { DataType } from "./vocabulary.js"
import {getEnumMemberName} from "zwave-js";

export class DataSchema extends Object {
    public constructor(init?:Partial<DataSchema>) {
        super();
        Object.assign(this, init)
    }

    // Used to indicate input, output, attribute. See vocab.WoSTAtType
    public "@type": string | undefined = undefined

    // Provides a default value of any type as per data schema
    public default: string | undefined = undefined

    // Provides additional (human-readable) information based on a default language
    public description: string | undefined = undefined
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

    // Human-readable title in the default language
    public title: string | undefined
    // Human-readable titles in additional languages
    public titles: string[] | undefined = undefined

    // Type provides JSON based data type,  one of DataTypeNumber, ...object, array, string, integer, boolean or null
    public type: DataType = DataType.Unknown

    // See vocab UnitNameXyz for units in the WoST vocabulary
    public unit: string | undefined = undefined

    // Boolean value to indicate whether a property interaction / value is write-only (=true) or not (=false)
    public writeOnly: boolean = false

    // Initial value at time of creation
    // this is always a string with optionally a unit
    // not part of the WoT definition but useful for testing and debugging
    public initialValue: string | undefined = undefined

    // Enumeration table to lookup the value or key
    private enumTable: Object|undefined = undefined

    // Change the property into a writable configuration
    SetAsConfiguration(): DataSchema {
        this.readOnly = false
        return this
    }

    // Add a list of enumerations to the schema.
    // This changes the schema to DataTypeString, fills in the enum array of strings, and
    // sets initialValue to the converted string.
    // enumeration is a map from enum values to names and vice-versa
    SetAsEnum(enumeration: Object, initialValue: number): DataSchema {
        this.initialValue = getEnumMemberName(enumeration, initialValue)
        this.enumTable = enumeration
        let keys = Object.values(enumeration)
        this.enum = keys.filter((key:any)=>{
            let isName = (!Number.isFinite(key))
            return isName
            }
        )
        return this
    }

    // Set the description and return this
    SetDescription(description:string): DataSchema {
        this.description = description
        return this
    }
}



export class InteractionAffordance extends Object {
    // Unique name of the affordance, eg: property, event or action name
    // While not part of the official specification, it allows passing the affordance
    // without having to separately pass its id.
    id: string = ""

    // type of affordance, eg temperature, switch,...
    "@type": string | undefined

    // Provides additional (human-readable) information based on a default language
    public description: string | undefined
    // Provides additional nulti-language information
    public descriptions: string[] | undefined = undefined

    // Human-readable title in the default language
    public title: string | undefined
    // Human-readable titles in additional languages
    public titles: string[] | undefined = undefined

}

/** Thing Description Action Affordance
 */
export class ActionAffordance extends InteractionAffordance {
    /**
     * Input data for the action when applicable
     */
    public input?: DataSchema = undefined

    /**
     * Action is idempotent. Repeated calls have the same result.
     */
    public idempotent?: boolean = undefined

    // // action input parameters
    // public inputs = new Map<string, {
    //   WoTDataType?: string,
    //   WoTProperties?: Map<string, string>,
    //   WoTRequired?: boolean,
    // }>()

    // Create an action affordance instance with a schema for its input, if any
    constructor(dataSchema?:DataSchema) {
        super();
        this.input = dataSchema
    }
}

/** Thing Description Event Affordance
 */
export class EventAffordance extends InteractionAffordance {
    // Data schema of the event instance message, eg the event payload
    public data?: DataSchema

    // Create an event affordance instance with a schema for its data, if any
    constructor(dataSchema?:DataSchema) {
        super();
        this.data = dataSchema
    }

}

/** Thing Description property affordance
 * The specification says this is an interaction affordance that is also a data schema?
 * JS doesn't support multiple inheritance so we'll use a dataschema and add the missing
 * 'forms' field from the interaction affordance. 
 */
export class PropertyAffordance extends DataSchema {

    // id is the property ID in the map, so it is available when the properties are provided as an array
    id: string = ""

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
     * @param title human readable title (name) of the device
     * @param deviceType one of vocabulary's DeviceTypeXyz
     * @param description more detailed description of the device
     */
    constructor(deviceID: string, deviceType: string, title: string, description: string) {
        super();
        this.id = deviceID;
        this["@type"] = deviceType;
        this.title = title;
        this.description = description;
        this.created = new Date().toISOString();
        this.modified = this.created;
    }

    /** Unique thing ID */
    public readonly id: string | undefined = "";

    /** Document creation date in ISO8601 */
    public created: string = "";

    /** Document modification date in ISO8601 */
    public modified: string = "";

    /** Human description for a thing */
    public description: string = "";

    /** Human-readable title for ui representation */
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
    // If the action accepts input parameters then set the .Data field to a DataSchema instance that
    // describes the parameter(s).
    //
    // @param id is the key under which it is stored in the action map.
    // @param actionType one of the action types from the vocabulary
    // @param title is the short display title of the action.
    // @param description optional detailed description of the action
    // @param input with optional dataschema of the action input data
    AddAction(id: string, actionType: string, title: string, description?: string, input?:DataSchema): ActionAffordance {
        let action = new ActionAffordance()
        action.id = id;
        action["@type"] = actionType
        action.title = title
        action.description = description
        action.input = input
        this.actions[id] = action;
        return action
    }

    // AddEvent provides a simple way to add an event definition to the TD.
    // This returns the event affordance that can be augmented/modified directly.
    //
    // @param id is the event instance ID under which it is stored in the event map.
    //        This can be anything arbitrary as long as the TD and value event use the same ID.
    // @param eventType one of the event types from the vocabulary
    // @param title is the short display title of the action.
    // @param description optional detailed description of the action
    // @param dataSchema optional event data schema
    AddEvent(id: string, eventType:string, title: string, description?: string, dataSchema?:DataSchema): EventAffordance {
        let ev = new EventAffordance()
        ev.id = id;
        ev["@type"] = eventType
        ev.title = title ? title : id;
        ev.description = description
        ev.data = dataSchema
        this.events[id] = ev;
        return ev
    }

    // AddProperty provides a simple way to add a Thing property to the TD
    // This returns the property affordance that can be augmented/modified directly
    // By default this property is read-only. (eg an attribute)
    //
    // @param id is the instance ID under which it is stored in the property affordance map.
    // @param propTypeName is the vocabulary defined property type or undefined when not defined
    // @param title is the title used in the property. Leave empty to use the name.
    // @param dataType is the type of data the property holds, DataTypeNumber, ..Object, ..Array, ..String, ..Integer, ..Boolean or null
    // @param initialValue the value at time of creation, for testing and debugging
    AddProperty(id: string, propTypeName: string|undefined, title: string | undefined, dataType: DataType, initialValue?: any): PropertyAffordance {
        let prop = new PropertyAffordance()
        prop.id = id;
        prop["@type"] = propTypeName
        prop.type = dataType;
        prop.title = title ? title : id;
        prop.readOnly = true;
        if (initialValue != undefined) {
            prop.initialValue = String(initialValue);
        }
        this.properties[id] = prop;
        return prop
    }


    // AddPropertyIf only adds the property if the first parameter is not undefined 
    //
    // @param initialValue add the attribute if the initial value is not undefined
    // @param id is the instance ID under which it is stored in the property affordance map.
    // @param propType is the vocabulary defined property type or "" when not defined
    // @param title is the title used in the property. Leave empty to use the name.
    // @param dataType is the type of data the property holds, DataTypeNumber, ..Object, ..Array, ..String, ..Integer, ..Boolean or null
    AddPropertyIf(
        initialValue: any,
        id: string,
        propType: string,
        title: string | undefined,
        dataType: DataType): PropertyAffordance | undefined {

        if (initialValue != undefined) {
            return this.AddProperty(id, propType, title, dataType, initialValue)
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
        return res
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
