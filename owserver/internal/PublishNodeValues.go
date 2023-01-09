package internal

import (
	"context"
	"time"

	"github.com/hiveot/bindings/owserver/internal/eds"
)

type NodeValueStamp struct {
	timestamp time.Time
	value     string
}

func (binding *OWServerBinding) getPrevValue(nodeID, attrName string) (value NodeValueStamp, found bool) {
	nodeValues, found := binding.values[nodeID]
	if found {
		value, found = nodeValues[attrName]
	}
	return value, found
}

func (binding *OWServerBinding) setPrevValue(nodeID, attrName string, value string) {
	nodeValues, found := binding.values[nodeID]
	if !found {
		nodeValues = make(map[string]NodeValueStamp)
		binding.values[nodeID] = nodeValues
	}
	nodeValues[attrName] = NodeValueStamp{
		timestamp: time.Now(),
		value:     value,
	}
}

// PollNodeValues obtains values of each 1-wire node and converts the EDS property names to vocabulary names.
// This returns a map of device/node IDs containing a maps of property name-value pairs
//func (binding *OWServerBinding) PollNodeValues() (nodeValues map[string](map[string]interface{}), err error) {
//
//	if binding.edsAPI == nil || !binding.isRunning.Load() {
//		err = fmt.Errorf("EDS API not initialized")
//		logrus.Error(err)
//		return
//	}
//	nodeValues, err = binding.edsAPI.PollValues()
//	// update service properties if enabled
//	if binding.Config.PublishTD {
//		serviceProps := make(map[string]interface{})
//		serviceProps[vocab.PropNameGatewayAddress] = binding.edsAPI.GetLastAddress()
//		nodeValues[binding.Config.ClientID] = serviceProps
//	}
//	return nodeValues, err
//}

// PublishValues publishes node property values of each node
// This takes a map of 1-wire node IDs and its property key-value map and emits them as an update event.
// Properties are combined as submitted as a single 'properties' event.
// Sensor values are send as individual events
//
//	onlyChanges, send the event only with changed values
//func (binding *OWServerBinding) PublishValues(
//	thingValues map[string]map[string]string, onlyChanges bool) (err error) {
//
//	ctx := context.Background()
//	// Iterate the devices and their properties
//	for deviceID, propValues := range thingValues {
//		// send all changed property attributes in a single properties event
//		attrMap := make(map[string][]byte)
//
//		for propName, propValue := range propValues {
//			skip := false
//			if onlyChanges {
//				prevValue := getPrevValue(deviceID, propName)
//				skip = prevValue == propValue
//			}
//			if !skip {
//				attrName, isAttr := eds.AttrVocab[propName]
//				_, isSensor := eds.SensorTypeVocab[propName]
//				if isSensor {
//					err = binding.pubsub.PubEvent(ctx, deviceID, propName, []byte(propValue))
//				} else if isAttr && attrName != "" {
//					attrMap[propName] = []byte(propValue)
//				}
//			}
//		}
//		if len(attrMap) > 0 {
//			err = binding.pubsub.PubProperties(ctx, deviceID, attrMap)
//		}
//	}
//	return err
//}

// PublishNodeValues publishes node property values of each node
// Properties are combined as submitted as a single 'properties' event.
// Sensor values are send as individual events
//
//	onlyChanges, send the event only with changed values
func (binding *OWServerBinding) PublishNodeValues(nodes []*eds.OneWireNode, onlyChanges bool) (err error) {

	ctx := context.Background()
	// Iterate the devices and their properties
	for _, node := range nodes {
		// send all changed property attributes in a single properties event
		attrMap := make(map[string][]byte)
		//thingID := thing.CreateThingID(binding.Config.BindingID, node.NodeID, node.DeviceType)
		thingID := node.NodeID

		for attrName, attr := range node.Attr {
			skip := false
			if onlyChanges {
				prevValue, found := binding.getPrevValue(node.NodeID, attrName)
				age := time.Now().Sub(prevValue.timestamp)
				maxAge := time.Second * time.Duration(binding.Config.RepublishInterval)
				// skip update if the value hasn't changed for less than the republish interval
				skip = found &&
					prevValue.value == attr.Value &&
					age < maxAge
			}
			if !skip {
				binding.setPrevValue(node.NodeID, attrName, attr.Value)
				if attr.IsSensor {
					err = binding.pubsub.PubEvent(ctx, thingID, attrName, []byte(attr.Value))
				} else {
					// attribute to be included in the properties event
					attrMap[attrName] = []byte(attr.Value)
				}
			}
		}
		if len(attrMap) > 0 {
			err = binding.pubsub.PubProperties(ctx, thingID, attrMap)
		}
	}
	return err
}

// RefreshPropertyValues polls the OWServer hub for Thing property values
//
//	onlyChanges only submit changed values
func (binding *OWServerBinding) RefreshPropertyValues(onlyChanges bool) error {
	nodes, err := binding.edsAPI.PollNodes()
	//nodeValueMap, err := binding.PollNodeValues()
	if err == nil {
		err = binding.PublishNodeValues(nodes, onlyChanges)
	}
	return err
}
