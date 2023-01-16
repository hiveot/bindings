package internal_test

import (
	"context"
	"encoding/json"
	"os"
	"path"
	"sync/atomic"
	"testing"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/hiveot/hub/lib/logging"
	"github.com/hiveot/hub/lib/thing"
	"github.com/hiveot/hub/pkg/pubsub"
	"github.com/hiveot/hub/pkg/pubsub/service"

	"github.com/hiveot/bindings/owserver/internal"
	"github.com/hiveot/hub.capnp/go/vocab"
)

// var homeFolder string
const testBindingID = "owserver-test"

var tempFolder string
var owsConfig internal.OWServerBindingConfig
var owsSimulationFile string // simulation file

var pubSubClient pubsub.IPubSubService

// TestMain run mosquitto and use the project test folder as the home folder.
// All tests are run using the simulation file.
func TestMain(m *testing.M) {
	// setup environment
	tempFolder = path.Join(os.TempDir(), "test-owserver")
	cwd, _ := os.Getwd()
	homeFolder := path.Join(cwd, "../docs")
	owsSimulationFile = "file://" + path.Join(homeFolder, "owserver-simulation.xml")
	logging.SetLogging("info", "")

	// use the server instance as the pubsub client
	pubSubClient = service.NewPubSubService()

	// load the plugin config with client cert
	owsConfig = internal.NewBindingConfig()
	owsConfig.BindingID = testBindingID
	owsConfig.OWServerAddress = owsSimulationFile

	result := m.Run()
	time.Sleep(time.Second)

	if result == 0 {
		_ = os.RemoveAll(tempFolder)
	}

	os.Exit(result)
}

func TestStartStop(t *testing.T) {
	logrus.Infof("--- TestStartStop ---")
	ctx, ctxCancelFn := context.WithCancel(context.Background())
	defer ctxCancelFn()

	ps, err := pubSubClient.CapDevicePubSub(ctx, owsConfig.BindingID)
	require.NoError(t, err)
	svc := internal.NewOWServerBinding(owsConfig, ps)
	go func() {
		err := svc.Start(ctx)
		assert.NoError(t, err)
	}()
	time.Sleep(time.Second)
	svc.Stop()
}

func TestPoll(t *testing.T) {
	var tdCount atomic.Int32

	logrus.Infof("--- TestPoll ---")
	ctx := context.Background()
	devicePubSub, err := pubSubClient.CapDevicePubSub(ctx, owsConfig.BindingID)
	require.NoError(t, err)
	svc := internal.NewOWServerBinding(owsConfig, devicePubSub)

	// Count the number of received TD events
	servicePubSub, err := pubSubClient.CapServicePubSub(ctx, "testclient")
	assert.NoError(t, err)
	err = servicePubSub.SubEvent(ctx, owsConfig.BindingID, "", "",
		func(ev *thing.ThingValue) {
			if ev.Name == vocab.WoTProperties {
				var value map[string][]byte
				err = json.Unmarshal(ev.ValueJSON, &value)
				assert.NoError(t, err)
				//for propName, propValue := range value {
				//	pv := string(propValue)
				//logrus.Infof("%s: %s", propName, pv)
				//}
			} else {
				var value interface{}
				err = json.Unmarshal(ev.ValueJSON, &value)
				assert.NoError(t, err)
			}
			tdCount.Add(1)
		})
	assert.NoError(t, err)

	// start the service which publishes TDs
	go func() {
		err := svc.Start(ctx)
		assert.NoError(t, err)
	}()

	// wait until startup poll completed
	time.Sleep(time.Millisecond * 1000)

	// the simulation file contains 3 things. The service is 1 thing.
	assert.GreaterOrEqual(t, tdCount.Load(), int32(4))
	svc.Stop()
}

//
//func TestPollValuesNotInitialized(t *testing.T) {
//	logrus.Infof("--- TestPollValuesNotInitialized ---")
//
//	ctx := context.Background()
//	devicePubSub, err := pubSubClient.CapDevicePubSub(ctx, owsConfig.BindingID)
//	require.NoError(t, err)
//	svc := internal.NewOWServerBinding(owsConfig, devicePubSub)
//	// no start
//	nodes, err := svc.PollNodes()
//	require.NoError(t, err)
//	err = svc.PublishNodeValues(nodes, false)
//	require.Error(t, err)
//}

// func TestPollValuesBadAddres(t *testing.T) {
// 	logrus.Infof("--- TestPollValuesBadAddres ---")

//		svc := internal.NewOWServerPB(testPluginID, mqttHostPort, hubConfig.CaCert, hubConfig.PluginCert)
//		// some address that is incorrect
//		svc.Config.OWServerAddress = "192.168.0.123"
//		err := svc.Start()
//		assert.NoError(t, err)
//		_, err = svc.PollValues()
//		require.Error(t, err)
//	}
func TestPollInvalidEDSAddress(t *testing.T) {
	logrus.Infof("--- TestPollInvalidEDSAddress ---")

	ctx := context.Background()
	devicePubSub, err := pubSubClient.CapDevicePubSub(nil, owsConfig.BindingID)
	require.NoError(t, err)
	svc := internal.NewOWServerBinding(owsConfig, devicePubSub)
	svc.Config.OWServerAddress = "http://invalidAddress/"

	go func() {
		err := svc.Start(ctx)
		assert.NoError(t, err)
	}()

	time.Sleep(time.Millisecond * 10)

	_, err = svc.PollNodes()
	assert.Error(t, err)
	svc.Stop()
}

func TestAction(t *testing.T) {
	logrus.Infof("--- TestAction ---")
	// node in test data
	const nodeID = "C100100000267C7E"
	//var nodeAddr = thing.MakeThingAddr(owsConfig.BindingID, nodeID)
	var actionName = vocab.PropNameRelay
	var actionValue = ([]byte)("1")

	ctx, ctxCancelFn := context.WithCancel(context.Background())
	defer ctxCancelFn()

	ps, err := pubSubClient.CapDevicePubSub(ctx, owsConfig.BindingID)
	require.NoError(t, err)
	svc := internal.NewOWServerBinding(owsConfig, ps)
	go func() {
		err := svc.Start(ctx)
		assert.NoError(t, err)
	}()
	// give Start time to run
	time.Sleep(time.Millisecond * 10)

	// This will log an error as the simulation file doesn't accept writes
	servicePubSub, err := pubSubClient.CapServicePubSub(ctx, "testclient")
	assert.NoError(t, err)
	err = servicePubSub.PubAction(ctx, owsConfig.BindingID, nodeID, actionName, actionValue)
	assert.NoError(t, err)

	time.Sleep(time.Second * 1)
	svc.Stop()
}
