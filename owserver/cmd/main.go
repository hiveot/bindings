package main

import (
	"capnproto.org/go/capnp/v3/rpc"
	"context"
	"crypto/tls"
	"crypto/x509"
	"os"

	"github.com/sirupsen/logrus"

	"github.com/hiveot/hub/lib/hubclient"
	"github.com/hiveot/hub/lib/listener"
	"github.com/hiveot/hub/lib/svcconfig"
	"github.com/hiveot/hub/pkg/pubsub"
	"github.com/hiveot/hub/pkg/pubsub/capnpclient"

	"github.com/hiveot/bindings/owserver/internal"
)

func main() {
	f, bindingCert, caCert := svcconfig.SetupFolderConfig(internal.DefaultBindingID)
	bindingConfig := internal.NewBindingConfig()
	_ = f.LoadConfig(&bindingConfig)

	//logging.SetLogging(bindingConfig.Loglevel, hubConfig.LogFile)
	pubSubSvc, rpcConn, err := ConnectToHub(
		bindingConfig.BindingID,
		bindingConfig.HubURL,
		bindingCert, caCert)

	if err != nil {
		logrus.Fatalf("unable to launch binding: %s", err)
	}

	binding := internal.NewOWServerBinding(bindingConfig, pubSubSvc)
	ctx := listener.ExitOnSignal(context.Background(), nil)
	err = binding.Start(ctx)
	_ = rpcConn.Close()

	if err != nil {
		logrus.Errorf("%s: Failed to start: %s", internal.DefaultBindingID, err)
		os.Exit(1)
	}
	os.Exit(0)
}

// ConnectToHub obtains the pubsub client from the Hub
func ConnectToHub(instanceID, fullUrl string,
	bindingCert *tls.Certificate, caCert *x509.Certificate) (pubsub.IDevicePubSub, *rpc.Conn, error) {

	rpcConn, hubClient, err := hubclient.ConnectToHubClient(fullUrl, bindingCert, caCert)
	if err != nil {
		return nil, nil, err
	}
	//cl, err := hubclient.GetDevicePubSubClient(conn, instanceID)
	pubsubCl := capnpclient.NewPubSubClient(hubClient)
	deviceClient, err := pubsubCl.CapDevicePubSub(context.Background(), instanceID)

	return deviceClient, rpcConn, err
}
