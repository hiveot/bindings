package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"os"

	"github.com/sirupsen/logrus"

	"github.com/hiveot/bindings/owserver/internal"
	"github.com/hiveot/hub/lib/listener"
	"github.com/hiveot/hub/lib/svcconfig"
	"github.com/hiveot/hub/pkg/pubsub"
	"github.com/hiveot/hub/pkg/pubsub/client"
)

func main() {
	bindingConfig := internal.NewBindingConfig()
	f, bindingCert, caCert := svcconfig.LoadServiceConfig(
		internal.DefaultBindingID, false, &bindingConfig)
	_ = f

	//logging.SetLogging(bindingConfig.Loglevel, hubConfig.LogFile)
	pubSubSvc, err := ConnectToHub(
		bindingConfig.BindingID,
		bindingConfig.HubNetwork,
		bindingConfig.HubAddress,
		bindingCert, caCert)

	if err != nil {
		logrus.Fatalf("unable to launch binding: %s", err)
	}

	binding := internal.NewOWServerBinding(bindingConfig, pubSubSvc)
	ctx := listener.ExitOnSignal(context.Background(), nil)
	err = binding.Start(ctx)

	if err != nil {
		logrus.Errorf("%s: Failed to start: %s", internal.DefaultBindingID, err)
		os.Exit(1)
	}
	os.Exit(0)
}

// ConnectToHub obtains the pubsub client from the Hub
func ConnectToHub(instanceID, network, address string,
	bindingCert *tls.Certificate, caCert *x509.Certificate) (pubsub.IDevicePubSub, error) {

	conn, err := listener.ConnectToHub(network, address, bindingCert, caCert)
	if err != nil {
		return nil, err
	}
	cl, err := client.GetDevicePubSubClient(conn, instanceID)
	return cl, err
}
