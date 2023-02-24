// Definition of Thing TD fields 
// This javascript definition must be kept in sync with the golang hub/lib/client/pkg/vocab definitions

// FIXME: use vocab generated from capnp 


// Wost device types
export const DeviceTypeAlarm = "alarm"          // an alarm emitter
export const DeviceTypeAVControl = "avControl"      // Audio/Video controller
export const DeviceTypeAVReceiver = "avReceiver"     // Node is a (not so) smart radio/receiver/amp (eg, denon)
export const DeviceTypeBeacon = "beacon"         // device is a location beacon
export const DeviceTypeButton = "button"         // device is a physical button device with one or more buttons
export const DeviceTypeAdapter = "adapter"        // software adapter or service, eg virtual device
export const DeviceTypePhone = "phone"          // device is a phone
export const DeviceTypeCamera = "camera"         // Node with camera
export const DeviceTypeComputer = "computer"       // General purpose computer
export const DeviceTypeDimmer = "dimmer"         // light dimmer
export const DeviceTypeGateway = "gateway"        // Node is a gateway for other nodes (onewire, zwave, etc)
export const DeviceTypeKeypad = "keypad"         // Entry key pad
export const DeviceTypeLock = "lock"           // Electronic door lock
export const DeviceTypeMultisensor = "multisensor"    // Node with multiple sensors
export const DeviceTypeNetRepeater = "netRepeater"    // Node is a zwave or other network repeater
export const DeviceTypeNetRouter = "netRouter"      // Node is a network router
export const DeviceTypeNetSwitch = "netSwitch"      // Node is a network switch
export const DeviceTypeNetWifiAP = "wifiAP"         // Node is a wifi access point
export const DeviceTypeOnOffSwitch = "onOffSwitch"    // Node is a physical on/off switch
export const DeviceTypePowerMeter = "powerMeter"     // Node is a power meter
export const DeviceTypeSensor = "sensor"         // Node is a single sensor (volt,...)
export const DeviceTypeService = "service"        // Node provides a service
export const DeviceTypeSmartlight = "smartlight"     // Node is a smart light, eg philips hue
export const DeviceTypeThermometer = "thermometer"    // Node is a temperature meter
export const DeviceTypeThermostat = "thermostat"     // Node is a thermostat control unit
export const DeviceTypeTV = "tv"             // Node is a (not so) smart TV
export const DeviceTypeUnknown = "unknown"        // type not identified
export const DeviceTypeWallpaper = "wallpaper"      // Node is a wallpaper montage of multiple images
export const DeviceTypeWaterValve = "waterValve"     // Water valve control unit
export const DeviceTypeWeatherService = "weatherService" // Node is a service providing current and forecasted weather
export const DeviceTypeWeatherStation = "weatherStation" // Node is a weatherstation device
export const DeviceTypeWeighScale = "weighScale"     // Node is an electronic weight scale

/**
 * Standardized property/event names to be used by Things and plugins to build their TD
 * If a device has multiple instances of a property (multi button, multi temperature) with
 * the same name then it becomes an object with nested properties for each instance.
 */
export const VocabAcceleration = "acceleration"
export const VocabActive = "active"
export const VocabAddress = "address" // device domain or ip address
export const VocabAirQuality = "airQuality"
export const VocabAlarm = "alarm"
export const VocabAlarmState = "alarmState"
export const VocabAlarmType = "alarmType"
export const VocabAtmosphericPressure = "atmosphericPressure"
export const VocabBatch = "batch" // Batch publishing size
export const VocabBatteryLevel = "batteryLevel"
export const VocabCarbonDioxideLevel = "co2level"
export const VocabCarbonMonoxideDetector = "coDetector"
export const VocabCarbonMonoxideLevel = "coLevel"
export const VocabChannel = "avChannel"
export const VocabColor = "color" // Color in hex notation
export const VocabColorTemperature = "colortemperature"
export const VocabConnections = "connections"
export const VocabCPULevel = "cpuLevel"
export const VocabDateTime = "dateTime"    //
export const VocabDescription = "description" // Device description
export const VocabDeviceType = "deviceType"  // Device type from list below
export const VocabDewpoint = "dewpoint"
export const VocabDimmer = "dimmer"
export const VocabDisabled = "disabled" // device or sensor is disabled
export const VocabDoorWindowSensor = "doorWindowSensor"
export const VocabDuration = "duration"
export const VocabElectricCurrent = "current"
export const VocabElectricEnergy = "energy"
export const VocabElectricPower = "power"
export const VocabErrors = "errors"
export const VocabEvent = "event" // Enable/disable event publishing
//
export const VocabFilename = "filename"       // [string] filename to write images or other values to
export const VocabFirmwareVersion = "firmwareVersion" // version of the physical device
export const VocabGatewayAddress = "gatewayAddress" // [string] the 3rd party gateway address
export const VocabHardwareVersion = "hardwareVersion" // version of the physical device
export const VocabHostname = "hostname"       // [string] network device hostname
export const VocabHeatIndex = "heatindex"      // [number] unit=C or F
export const VocabHue = "hue"            //
export const VocabHumidex = "humidex"        // [number] unit=C or F
export const VocabHumidity = "humidity"       // [string] %
export const VocabImage = "image"            // [byteArray] unit=jpg,gif,png
export const VocabLatency = "latency"        // [number] sec, msec
export const VocabLatitude = "latitude"      // [number]
export const VocabLatLon = "latlon"          // [number,number] latitude, longitude pair of the device for display on a map r/w
export const VocabLevel = "level"            // [number] generic sensor level
export const VocabLongitude = "longitude"    // [number]
export const VocabLocalIP = "localIP"        // [string] for IP nodes
export const VocabLocation = "location"      // [string]
export const VocabLocationName = "locationName"   // [string] name of a location
export const VocabLock = "lock"           //
export const VocabLoginName = "loginName"      // [string] login name to connect to the device. Value is not published
export const VocabLuminance = "luminance"      // [number]
export const VocabMAC = "mac"            // [string] MAC address for IP nodes
export const VocabManufacturer = "manufacturer"   // [string] device manufacturer
export const VocabMax = "max"            // [number] maximum value of sensor or config
export const VocabMin = "min"            // [number] minimum value of sensor or config
export const VocabModel = "model"          // [string] device model
export const VocabMotion = "motion"         // [boolean]
export const VocabMute = "avMute"         // [boolean]
export const VocabName = "name"           // [string] Name of device or service
export const VocabNetmask = "netmask"        // [string] IP network mask
export const VocabOnOffSwitch = "switch"         // [boolean]
//
export const VocabPassword = "password" // password to connect. Value is not published.
export const VocabPlay = "avPlay"
export const VocabPollInterval = "pollInterval" // polling interval in seconds
export const VocabPort = "port"         // network address port
export const VocabPowerSource = "powerSource"  // battery, usb, mains
export const VocabProduct = "product"      // device product or model name
export const VocabPublicKey = "publicKey"    // public key for encrypting sensitive configuration settings
export const VocabPushButton = "pushButton"   // with nr of pushes
export const VocabRain = "rain"
export const VocabRelay = "relay"
export const VocabSaturation = "saturation"
export const VocabScale = "scale"
export const VocabSignalStrength = "signalStrength"
export const VocabSmokeDetector = "smokeDetector"
export const VocabSnow = "snow"
export const VocabSoftwareVersion = "softwareVersion" // version of the application software running the node
export const VocabSoundDetector = "soundDetector"
export const VocabSubnet = "subnet" // IP subnets configuration
export const VocabSwitch = "switch" // on/off switch: "on" "off"
export const VocabTemperature = "temperature"
// export const VocabType              = "type" // Node type
export const VocabUltraviolet = "ultraviolet"
export const VocabUnknown = ""    // Not a known output
export const VocabURL = "url" // node URL
export const VocabVibrationDetector = "vibrationDetector"
export const VocabValue = "value" // generic value
export const VocabVoltage = "voltage"
export const VocabVolume = "volume"
export const VocabWaterLevel = "waterLevel"
export const VocabWeather = "weather" // description of weather, eg sunny
export const VocabWindHeading = "windHeading"
export const VocabWindSpeed = "windSpeed"



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
