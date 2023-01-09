package internal

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"sync"
	"sync/atomic"

	"github.com/sirupsen/logrus"

	"github.com/hiveot/bindings/owserver/internal/eds"
	"github.com/hiveot/hub.capnp/go/vocab"
	"github.com/hiveot/hub/lib/thing"
	"github.com/hiveot/hub/pkg/pubsub"
)

// OWServerBinding is the hub protocol binding plugin for capturing 1-wire OWServer V2 Data
type OWServerBinding struct {
	// Configuration of this protocol binding
	Config OWServerBindingConfig

	// EDS OWServer client API
	edsAPI *eds.EdsAPI

	// Hub CA certificate to validate gateway connection
	caCert *x509.Certificate

	// Client certificate of this binding
	bindingCert *tls.Certificate

	// pubsub to publish TDs and values
	pubsub pubsub.IDevicePubSub

	// track the last value for change detection
	// map of [node/device ID] [attribute name] value
	values map[string]map[string]NodeValueStamp

	// nodes by deviceID/thingID
	nodes map[string]*eds.OneWireNode

	// Map of previous node values [nodeID][attrName]value
	// nodeValues map[string]map[string]string

	// flag, this service is up and isRunning
	isRunning atomic.Bool
	mu        sync.Mutex
}

// CreateBindingTD generates a TD document for this binding
func (binding *OWServerBinding) CreateBindingTD() *thing.TD {
	thingID := binding.Config.BindingID
	td := thing.NewTD(thingID, "OWServer binding", vocab.DeviceTypeService)
	return td
}

// Start the OWServer protocol binding
// This connects to the hub pubsub, publishes a TD for this binding, starts a background heartbeat,
// and waits for the context to complete and end the connection.
//
//	ctx context to wait on.
func (binding *OWServerBinding) Start(ctx context.Context) error {

	// Create the adapter for the OWServer 1-wire gateway
	binding.edsAPI = eds.NewEdsAPI(
		binding.Config.OWServerAddress, binding.Config.LoginName, binding.Config.Password)

	// TODO: restore binding configuration

	td := binding.CreateBindingTD()
	tdDoc, _ := json.Marshal(td)
	err := binding.pubsub.PubTD(ctx, td.ID, td.DeviceType, tdDoc)
	if err != nil {
		return err
	}

	err = binding.pubsub.SubAction(ctx, "", "", binding.HandleActionRequest)
	if err != nil {
		return err
	}
	binding.isRunning.Store(true)

	go binding.heartBeat()

	logrus.Infof("Service OWServer startup completed")

	<-ctx.Done()
	binding.isRunning.Store(false)
	binding.pubsub.Release()
	return nil
}

// Stop the heartbeat and remove subscriptions
func (binding *OWServerBinding) Stop() {
	binding.isRunning.Store(false)
	// Start will release the pubsub subscriptions
}

// NewOWServerBinding creates a new OWServer Protocol Binding service
//
//	config holds the configuration of the service
//	devicePubSub holds the publish/subscribe service to use. It will be released on stop.
func NewOWServerBinding(config OWServerBindingConfig, devicePubSub pubsub.IDevicePubSub) *OWServerBinding {

	// these are from hub configuration
	pb := &OWServerBinding{
		pubsub:    devicePubSub,
		values:    make(map[string]map[string]NodeValueStamp),
		nodes:     make(map[string]*eds.OneWireNode),
		isRunning: atomic.Bool{},
	}
	pb.Config = config

	return pb
}
