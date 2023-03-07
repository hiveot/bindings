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

// HubAPI provides JS callable methods to the Hub
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
//
// If no valid capability has been obtained yet, one is requested from the gateway.
// Note that this requires a valid authentication by the gateway.
func (hapi *HubAPI) getServicePubSub() (pubsub.IServicePubSub, error) {
	var err error
	if !hapi.gwSession.IsValid() {
		return nil, errors.New("not connected to the gateway")
	}
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

// Ping is the async method to ping the gateway
func (hapi *HubAPI) Ping(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {
		var info gateway.ClientInfo
		gwc := capnpclient.NewGatewaySessionFromCapnpCapability(hapi.gwSession)
		info, err := gwc.Ping(context.Background())
		return js.ValueOf(info), err
	})
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

// PubEvent Async method for publishing the events
// args[0] = thingID
// args[1] = event name
// args[2] = event in json format
func (hapi *HubAPI) PubEvent(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {

		thingID := args[0].String()
		name := args[1].String()
		ev := args[2].String()
		logrus.Infof("publishing event for thing id=%s, event name=%s, ev=%s", thingID, name, ev)
		svcPubSub, err := hapi.getServicePubSub()
		if err != nil {
			return this, err
		}
		err = svcPubSub.PubEvent(context.Background(), thingID, name, []byte(ev))
		return this, err
	})
}

// PubProperties Async method for publishing thing properties
// args[0] = thingID
// args[1] = object<key:value>
func (hapi *HubAPI) PubProperties(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {
		props := make(map[string][]byte)

		thingID := args[0].String()
		propslen := args[1].Length()
		for i := 0; i < propslen; i++ {
			kv := args[1].Index(i)
			logrus.Infof("kv=%s", kv)
			// FIXME: how to get the object property name?
		}
		logrus.Infof("publishing properties for thing id=%s", thingID)
		svcPubSub, err := hapi.getServicePubSub()
		if err != nil {
			return this, err
		}
		err = svcPubSub.PubProperties(context.Background(), thingID, props)
		return this, err
	})
}

// PubTD Async method for publishing the TD document from JS
// args[0] = thingID
// args[1] = deviceType
// args[2] = td in json format
func (hapi *HubAPI) PubTD(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {

		thingID := args[0].String()
		deviceType := args[1].String()
		td := args[2].String() // td
		logrus.Infof("publishing td id=%s, dtype=%s", thingID, deviceType)
		svcPubSub, err := hapi.getServicePubSub()
		if err != nil {
			return this, err
		}
		err = svcPubSub.PubTD(context.Background(), thingID, []byte(td))
		return this, err
	})
}

// SubAction Async method for subscribing to actions from JS
// args[0] = thingID to subscribe to
// args[1] = callback handler to invoke: (publisher ID, thingID, actionName, actionValue)
func (hapi *HubAPI) SubAction(this js.Value, args []js.Value) interface{} {
	return jasm.Await(func() (js.Value, error) {

		thingID := args[0].String()
		handler := args[1]
		logrus.Infof("subscribing to actions for thing id=%s", thingID)
		svcPubSub, err := hapi.getServicePubSub()
		if err != nil {
			return this, err
		}
		err = svcPubSub.SubAction(context.Background(), thingID, "",
			func(tv *thing.ThingValue) {
				// FIXME. get the callback to work
				handler.Call(tv.PublisherID, tv.ThingID, tv.ID, tv.ValueJSON)
			})
		return this, err
	})
}

func NewHubAPI(serviceID string) *HubAPI {
	svc := &HubAPI{serviceID: serviceID}
	return svc
}
