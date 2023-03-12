package wsjs

import (
	"context"
	"errors"
	"os"
	"syscall/js"
	"time"

	"github.com/hiveot/hub/api/go/hubapi"

	"capnproto.org/go/capnp/v3"
	"capnproto.org/go/capnp/v3/rpc"
	"github.com/sirupsen/logrus"

	"github.com/hiveot/hub/pkg/pubsub"

	"github.com/hiveot/hub/lib/thing"
	"github.com/hiveot/hub/pkg/gateway"
	"github.com/hiveot/hub/pkg/gateway/capnpclient"
	pubsubclient "github.com/hiveot/hub/pkg/pubsub/capnpclient"

	wsockcap "zenhack.net/go/websocket-capnp/js"

	"github.com/hiveot/bindings/zwavejs/cmd/hapi/jasm"
)

// HubAPI provides JS callable methods to the Hub using a websocket connection to the Hub
type HubAPI struct {
	// instance ID of the service using this API
	serviceID string
	// websocket based encoder/decoder for capnp messaging
	wsCodec   *wsockcap.Conn
	gwSession hubapi.CapGatewaySession
	// _servicePubSub is loaded on demand. Use getServicePubSub() instead.
	_servicePubSub pubsub.IServicePubSub
}

// Obtain the pubsub API for use by services.
// On the first call this requests the capability from the gateway with the serviceID as the publisherID
// Successive calls reuse this capability.
// Note that this requires a valid authentication by the gateway.
func (hapi *HubAPI) getServicePubSub() (pubsub.IServicePubSub, error) {
	var err error
	if !hapi.gwSession.IsValid() {
		return nil, errors.New("not connected to the gateway")
	}
	// re-use the instance
	if hapi._servicePubSub != nil {
		return hapi._servicePubSub, nil
	}

	var pubSubSvc = pubsubclient.NewPubSubClient(capnp.Client(hapi.gwSession))
	logrus.Infof("hapi.serviceID=%s", hapi.serviceID)
	hapi._servicePubSub, err = pubSubSvc.CapServicePubSub(context.Background(), hapi.serviceID)
	return hapi._servicePubSub, err
}

// Connect to the Hub and create the gateway capnp client
// Use login to authenticate.
// Returns a promise
//
//	args[0] fullURL is the full websocket address, eg: wss://addr:port/ws
//	args[1] clientCertPem with client certificate for client authentication
//	args[2] clientKeyPem with client key for client authentication
//	args[3] caCertPem with CA's certificate for server authentication
func (hapi *HubAPI) Connect(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {
		fullURL := args[0].String()
		// discover the hub's gateway address
		if fullURL == "" {
			fullURL = "ws://127.0.0.1:8444"
		}
		clientCertPem, _ := os.ReadFile("/home/henk/bin/hiveot/certs/zwavejsCert.pem")
		clientKeyPem, _ := os.ReadFile("/home/henk/bin/hiveot/certs/zwavejsKey.pem")
		caCertPem, _ := os.ReadFile("/home/henk/bin/hiveot/certs/caCert.pem")

		// Create a websocket connection to the hub
		ctx := context.Background()
		opts := make(map[string]any)
		//opts["rejectUnauthorized"] = false
		opts["cert"] = string(clientCertPem)
		opts["key"] = string(clientKeyPem)
		opts["ca"] = string(caCertPem)
		//hapi.wsCodec = wsockcap.New(ctx, fullURL, nil, nil)
		hapi.wsCodec = wsockcap.New(ctx, fullURL, nil, opts)
		//string(clientCertPem), string(clientKeyPem), string(caCertPem))
		logrus.Infof("connecting to %s", fullURL)
		err := hapi.wsCodec.WaitForConnection(time.Second)

		if err != nil {
			logrus.Errorf("Connecting FAILED: %s", err)
			return this, err
		}
		tp := rpc.NewTransport(hapi.wsCodec)
		rpcConn := rpc.NewConn(tp, nil)
		hapi.gwSession = hubapi.CapGatewaySession(rpcConn.Bootstrap(ctx))

		logrus.Infof("Connected to %s. Valid=%v", fullURL, hapi.gwSession.IsValid())

		return this, nil
	})
}

// Disconnect from the Hub
func (hapi *HubAPI) Disconnect() {
	if hapi._servicePubSub != nil {
		hapi._servicePubSub.Release()
		hapi._servicePubSub = nil
	}
	if hapi.gwSession.IsValid() {
		hapi.gwSession.Release()
	}
	if hapi.wsCodec != nil {
		err := hapi.wsCodec.Close()
		hapi.wsCodec = nil
		if err != nil {
			logrus.Errorf("Disconnect error: %s", err)
		}
	}
}

// Login is the async method to login to the gateway
// args: (loginID string, password string)
func (hapi *HubAPI) Login(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {
		loginID := args[0].String()
		password := args[1].String()
		method, release := hapi.gwSession.Login(context.Background(), func(params hubapi.CapGatewaySession_login_Params) error {
			_ = params.SetClientID(loginID)
			err := params.SetPassword(password)
			return err
		})
		defer release()
		_, err := method.Struct()
		return this, err
	})
}

// Ping is the async method to ping the gateway
func (hapi *HubAPI) Ping(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {
		var info gateway.ClientInfo
		gwc := capnpclient.NewGatewaySessionFromCapnpCapability(hapi.gwSession)
		info, err := gwc.Ping(context.Background())
		return js.ValueOf(info), err
	})
}

// PubEvent Async method for publishing the events
// args[0] = thingID
// args[1] = event name
// args[2] = event data serialized
func (hapi *HubAPI) PubEvent(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {

		thingID := args[0].String()
		name := args[1].String()
		ev := args[2].String()
		logrus.Infof("publishing event for thing id=%s, event name=%s, size=%d", thingID, name, len(ev))
		svcPubSub, err := hapi.getServicePubSub()
		if err != nil {
			return this, err
		}
		err = svcPubSub.PubEvent(context.Background(), thingID, name, []byte(ev))
		return this, err
	})
}

// SubActions Async method for subscribing to all actions of a given thing, or all things.
// args[0] = callback handler to invoke: (publisher ID, thingID, actionName, actionValue)
func (hapi *HubAPI) SubActions(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {

		handler := args[0]
		logrus.Infof("subscribing to actions of things from publisher %s", hapi.serviceID)
		svcPubSub, err := hapi.getServicePubSub()
		if err != nil {
			return this, err
		}
		err = svcPubSub.SubAction(context.Background(), "", "",
			func(tv *thing.ThingValue) {
				handler.Invoke(tv.ThingID, tv.ID, string(tv.Data))
			})
		return this, err
	})
}

func NewHubAPI(serviceID string) *HubAPI {
	svc := &HubAPI{serviceID: serviceID}
	return svc
}
