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
