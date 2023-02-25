package internal

import (
	"context"
	"encoding/json"

	"github.com/hiveot/bindings/owserver/internal/eds"
	"github.com/hiveot/hub/api/go/vocab"

	"github.com/hiveot/hub/lib/thing"
)

// CreateTDFromNode converts the 1-wire node into a TD that describes the node.
// - All attributes will be added as node properties
// - Writable non-sensors attributes are marked as writable configuration
// - Sensors are also added as events.
// - Writable sensors are also added as actions.
func (binding *OWServerBinding) CreateTDFromNode(node *eds.OneWireNode) (tdoc *thing.TD) {

	// Should we bother with the URI? In HiveOT things have pubsub addresses that include the ID. The ID is not the address.
	//thingID := thing.CreateThingID(binding.Config.BindingID, node.NodeID, node.DeviceType)
	thingID := node.NodeID

	tdoc = thing.NewTD(thingID, node.Name, node.DeviceType)
	tdoc.AddProperty(vocab.VocabDescription, node.Description, vocab.WoTDataTypeString)
	tdoc.UpdateTitleDescription(node.Name, node.Description)

	// Map node attribute to Thing properties
	for attrName, attr := range node.Attr {
		prop := tdoc.AddProperty(attrName, attr.Name, attr.DataType)
		prop.Unit = attr.Unit

		// sensors are added as both properties and events
		if attr.IsSensor {
			// sensors emit events
			eventID := attrName
			evAff := tdoc.AddEvent(eventID, attrName, attrName, "")
			// TODO: only add data schema if the event carries a value
			evAff.Data = &thing.DataSchema{
				Type: attr.DataType,
				Unit: prop.Unit,
			}

			// writable sensors are actuators and can be triggered with actions
			if attr.Writable {
				actionID := attrName
				actionAff := tdoc.AddAction(actionID, attrName, attrName, "")
				// TODO: only add input schema if the action takes a value
				actionAff.Input = &thing.DataSchema{
					Type: attr.DataType,
					Unit: prop.Unit,
				}
			}
		} else {
			// non-sensors are attributes. Writable attributes are configuration.
			if attr.Writable {
				prop.ReadOnly = false
			} else {
				prop.ReadOnly = true
			}
		}
	}
	return
}

// PollNodes polls the OWServer gateway for nodes and property values
func (binding *OWServerBinding) PollNodes() ([]*eds.OneWireNode, error) {
	nodes, err := binding.edsAPI.PollNodes()
	for _, node := range nodes {
		binding.nodes[node.NodeID] = node
	}
	return nodes, err
}

// PublishThings converts the nodes to TD documents and publishes these on the Hub message bus
// This returns an error if one or more publications fail
func (binding *OWServerBinding) PublishThings(nodes []*eds.OneWireNode) (err error) {
	ctx := context.Background()
	for _, node := range nodes {
		td := binding.CreateTDFromNode(node)
		tdDoc, _ := json.Marshal(td)
		err2 := binding.pubsub.PubTD(ctx, td.ID, td.AtType, tdDoc)
		if err2 != nil {
			err = err2
		}
	}
	return err
}
