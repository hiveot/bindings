package internal

// DefaultBindingID is the default ID of this service. Used to name the configuration file
// and as the publisher ID portion of the Thing ID (zoneID:publisherID:deviceID:deviceType)
const DefaultBindingID = "owserver"

// OWServerBindingConfig contains the plugin configuration
type OWServerBindingConfig struct {
	// BindingID optional override of the instance ID of the binding in case of multiple instances.
	// Default is 'owserver'. Recommended is to add a '-1' in case of multiple instances.
	BindingID string `yaml:"bindingID"`

	// HubNetwork optional network to connect with.
	// Default "" is tcp. Use 'unix' for UDS
	HubNetwork string `yaml:"hubNetwork,omitempty"`

	// HubAddress optional address:port to connect to.
	// Default "" is auto discovery trying resolver first and gateway second.
	HubAddress string `yaml:"hubAddress,omitempty"`

	// OWServerAddress optional http://address:port of the EDS OWServer-V2 gateway.
	// Default "" is auto-discover using DNS-SD
	OWServerAddress string `yaml:"owserverAddress,omitempty"`

	// LoginName and password to the EDS OWserver using Basic Auth.
	LoginName string `yaml:"loginName,omitempty"`
	Password  string `yaml:"password,omitempty"`

	// TDInterval optional override interval of republishing the full TD, in seconds.
	// Default is 12 hours
	TDInterval int `yaml:"tdInterval,omitempty"`

	// PollInterval optional override interval of polling Thing values, in seconds.
	// Default is 60 seconds
	PollInterval int `yaml:"pollInterval,omitempty"`

	// RepublishInterval optional override interval that unmodified Thing values are republished, in seconds.
	// Default is 3600 seconds
	RepublishInterval int `yaml:"republishInterval,omitempty"`
}

// NewBindingConfig returns a OWServerBindingConfig with default values
func NewBindingConfig() OWServerBindingConfig {
	cfg := OWServerBindingConfig{}

	// ensure valid defaults
	cfg.BindingID = DefaultBindingID
	cfg.TDInterval = 3600 * 12
	cfg.PollInterval = 60
	cfg.RepublishInterval = 3600
	return cfg
}
