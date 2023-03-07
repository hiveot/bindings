// Definition of Thing TD fields 
// This javascript definition must be kept in sync with the golang hub/lib/client/pkg/vocab definitions

// FIXME: use vocab generated from capnp 

// ActionTypes standardized operator action @types
export declare enum ActionTypes {
    Lock = "lock",        // [bool] lock/unlock action
    Mute = "mute",        // [bool] AV mute onoff (0,1) or toggle
    On = "on",            // [number] lights 0-100
    Open = "open",        // [number] open valve 0-100
    Play = "play",        // [bool] AV play/pause action
    SetValue = "value",   // [number] set generic value
    Volume = "volume",    // [number] set new volume 0.100%
}

// HiveOT device types
export const DeviceTypeAdapter = "adapter"        // software adapter or service, eg virtual device
export const DeviceTypeAVControl = "avControl"      // Audio/Video controller
export const DeviceTypeAVReceiver = "avReceiver"     // Node is a (not so) smart radio/receiver/amp (eg, denon)
export const DeviceTypeBeacon = "beacon"         // device is a location beacon
export const DeviceTypeButton = "button"         // device is a physical button device with one or more buttons
export const DeviceTypeCamera = "camera"         // Node with camera
export const DeviceTypeCarbonMonoxideDetector = "coDetector"
export const DeviceTypeComputer = "computer"       // General purpose computer
export const DeviceTypeDimmer = "dimmer"         // light dimmer
export const DeviceTypeDoorWindowSensor = "doorWindowSensor"
export const DeviceTypeGateway = "gateway"        // device is a gateway for other nodes (onewire, zwave, etc)
export const DeviceTypeKeypad = "keypad"         // Entry key pad
export const DeviceTypeLock = "lock"             // Electronic door lock
export const DeviceTypeMultisensor = "multisensor"    // Node with multiple sensors
export const DeviceTypeNetRepeater = "netRepeater"    // Node is a zwave or other network repeater
export const DeviceTypeNetRouter = "netRouter"      // Node is a network router
export const DeviceTypeNetSwitch = "netSwitch"      // Node is a network switch
export const DeviceTypeNetWifiAP = "wifiAP"         // Node is a wifi access point
export const DeviceTypeOnOffSwitch = "onOffSwitch"    // Node is a physical on/off switch
export const DeviceTypePhone = "phone"          // device is a phone
export const DeviceTypePowerMeter = "powerMeter"     // Node is a power meter
export const DeviceTypePushbutton = "pushbutton"     // Node is a push button switch
export const DeviceTypeSceneController = "sceneController"   // Node is a scene controller for other devices
export const DeviceTypeSensor = "sensor"         // Node is a single sensor (volt,...)
export const DeviceTypeService = "service"        // Node provides a service
export const DeviceTypeSmartlight = "smartlight"     // Node is a smart light, eg philips hue
export const DeviceTypeSmokeDetector = "smokeDetector"  // Node is a smoke detector
export const DeviceTypeThermometer = "thermometer"    // Node is a temperature meter
export const DeviceTypeThermostat = "thermostat"     // Node is a thermostat control unit
export const DeviceTypeTV = "tv"             // Node is a (not so) smart TV
export const DeviceTypeUnknown = "unknown"        // type not identified
export const DeviceTypeWallpaper = "wallpaper"      // Node is a wallpaper montage of multiple images
export const DeviceTypeWaterValve = "waterValve"     // Water valve control unit
export const DeviceTypeWeatherService = "weatherService" // Node is a service providing current and forecasted weather
export const DeviceTypeWeatherStation = "weatherStation" // Node is a weatherstation device
export const DeviceTypeWeighScale = "weighScale"     // Node is an electronic weight scale

// standardized sensor event types
// standardized event @types when sensor or actuator values change
export const EventTypeAcceleration = "acceleration"
export const EventTypeAirQuality = "airQuality"
export const EventTypeAlarm = "alarm"       // motion or other alarm state changed
export const EventTypeAtmosphericPressure = "atmosphericPressure"
export const EventTypeBinarySwitch = "binarySwitch"
export const EventTypeCarbonDioxideLevel = "co2level"
export const EventTypeCarbonMonoxideLevel = "coLevel"
export const EventTypeCurrent = "current"
export const EventTypeDewpoint = "dewpoint"
export const EventTypeEnergy = "energy"
export const EventTypeHeatIndex = "heatIndex"
export const EventTypeHumidex = "humidity"
export const EventTypeLevel = "level"            // [number] generic sensor level
export const EventTypeLatLon = "latlon"          // [lat, lon] location change
export const EventTypeLowBattery = "lowBattery"
export const EventTypeLuminance = "luminance"    // [number]
export const EventTypeMultilevelSwitch = "multiLevelSwitch"
export const EventTypePower = "power"         // power meter
export const EventTypePushButton = "pushButton"
export const EventTypeSound = "sound"            // sound detector
export const EventTypeTemperature = "temperature"
export const EventTypeUV = "ultraviolet"
export const EventTypeVibration = "vibration"   // vibration sensor or alarm
export const EventTypeValue = "value"    // generic sensor value event
export const EventTypeVoltage = "voltage"
export const EventTypeWaterLevel = "waterLevel"
export const EventTypeWindHeading = "windHeading"
export const EventTypeWindSpeed = "windSpeed"

// standardized management property @types
export const ManageTypeHealthCheck = "healthCheck"  // []action is to initiate a health check
export const ManageTypePing = "ping"        // [] action is to check if the destination is reachable
export const ManageTypeReset = "reset"      // [] action is to reset the device
export const ManageTypeRefresh = "refresh"  // [] action is to refresh the device info and send a new TD


// standardized property attribute @types from HiveOT vocabulary
export  enum PropTypes {
   AlarmType = "alarmType",
   CPULevel = "cpuLevel",
   DateTime = "dateTime",
   BatteryLevel = "batteryLevel",
   FirmwareVersion = "firmwareVersion",
   HardwareVersion = "hardwareVersion", // version of the physical device
   Latency = "latency",
   Manufacturer = "manufacturer",       // [string] device manufacturer
   ProductName = "productName",
   SignalStrength = "signalStrength",
   SoftwareVersion = "softwareVersion", // application software
}

/**
 * Standardized property/event names to be used by Things and plugins to build their TD
 * If a device has multiple instances of a property (multi button, multi temperature) with
 * the same name then it becomes an object with nested properties for each instance.
 */
// export const VocabAddress = "address" // device domain or ip address
// export const VocabBatch = "batch" // Batch publishing size
// export const VocabChannel = "avChannel"
// export const VocabColor = "color" // Color in hex notation
// export const VocabColorTemperature = "colortemperature"
// export const VocabConnections = "connections"
// export const VocabDisabled = "disabled" // device or sensor is disabled
// export const VocabDuration = "duration"
// export const VocabErrors = "errors"
// //
// export const VocabFilename = "filename"       // [string] filename to write images or other values to
// export const VocabGatewayAddress = "gatewayAddress" // [string] the 3rd party gateway address
// export const VocabHostname = "hostname"       // [string] network device hostname
// export const VocabHue = "hue"            //
// // export const VocabHumidex = "humidex"        // [number] unit=C or F
// // export const VocabHumidity = "humidity"       // [string] %
// export const VocabImage = "image"            // [byteArray] unit=jpg,gif,png
// export const VocabLocationName = "locationName"   // [string] name of a location
// export const VocabLoginName = "loginName"      // [string] login name to connect to the device. Value is not published
// export const VocabMAC = "mac"            // [string] MAC address for IP nodes
// export const VocabName = "name"           // [string] Name of device or service
// export const VocabNetmask = "netmask"        // [string] IP network mask
// export const VocabPassword = "password" // password to connect. Value is not published.
// export const VocabPollInterval = "pollInterval" // polling interval in seconds
// export const VocabPort = "port"         // network address port
// export const VocabPowerSource = "powerSource"  // battery, usb, mains
// export const VocabPublicKey = "publicKey"    // public key for encrypting sensitive configuration settings
// // export const VocabRain = "rain"
// export const VocabRelay = "relay"
// export const VocabSaturation = "saturation"
// export const VocabScale = "scale"
// export const VocabSnow = "snow"
// export const VocabSubnet = "subnet" // IP subnets configuration
// export const VocabUnknown = ""    // Not a known output
// export const VocabURL = "url" // node URL



/**
 * The following terms are defined in the WoT Thing Description definition
 */
// WoT data schema
export const TDAtType = "@type"
export const TDAtContext = "@context"
export const TDAnyURI = "https://www.w3.org/2019/wot/td/v1"
export const TDActions = "actions"
export const TDCreated = "created"
export const TDDescription = "description"
export const TDDescriptions = "descriptions"
export const TDEvents = "events"
export const TDForms = "forms"
export const TDID = "id"
export const TDLinks = "links"
export const TDProperties = "properties"
export const TDSecurity = "security"
export const TDSupport = "support"
export const TDTitle = "title"
export const TDTitles = "titles"
export const TDVersion = "version"

// additional data schema vocab
export const TDConst = "const"
export enum DataType {
    Bool = "boolean",
    AnyURI = "anyURI",
    Array = "array",
    DateTime = "dateTime",
    Integer = "integer",
    Number = "number",
    Object = "object",
    String = "string",
    UnsignedInt = "unsignedInt",
    Unknown = ""
}
// WoTDouble              = "double" // min, max of number are doubles
export const TDEnum = "enum"
export const TDFormat = "format"
export const TDHref = "href"
export const TDInput = "input"
export const TDMaximum = "maximum"
export const TDMaxItems = "maxItems"
export const TDMaxLength = "maxLength"
export const TDMinimum = "minimum"
export const TDMinItems = "minItems"
export const TDMinLength = "minLength"
export const TDModified = "modified"
export const TDOperation = "op"
export const TDOutput = "output"
export const TDReadOnly = "readOnly"
export const TDRequired = "required"
export const TDWriteOnly = "writeOnly"
export const TDUnit = "unit"
