package internal

import (
	"context"
	"encoding/json"
	"github.com/hiveot/hub/api/go/hubapi"

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
	tdoc.UpdateTitleDescription(node.Name, node.Description)

	// Map node attribute to Thing properties
	for attrName, attr := range node.Attr {
		// sensors are added as both properties and events
		if attr.IsSensor {
			// sensors emit events
			eventID := attrName
			title := attr.Name
			evAff := tdoc.AddEvent(eventID, attr.VocabType, title, "")
			// only add data schema if the event carries a value
			if attr.DataType != vocab.WoTDataTypeNone {
				evAff.Data = &thing.DataSchema{
					Type:         attr.DataType,
					Unit:         attr.Unit,
					InitialValue: attr.Value,
				}
				if attr.Unit != "" {
					evAff.Data.InitialValue += " " + attr.Unit
				}
			}

		} else if attr.IsActuator {
			actionID := attrName
			actionAff := tdoc.AddAction(actionID, attr.VocabType, attr.Name, "")

			// only add data schema if the action accepts parameters
			if attr.DataType != vocab.WoTDataTypeNone {
				actionAff.Input = &thing.DataSchema{
					Type: attr.DataType,
					Unit: attr.Unit,
				}
			}
		} else {
			// TODO: map properties to type where possible
			prop := tdoc.AddProperty(attrName, "", attr.Name, attr.DataType)
			prop.Unit = attr.Unit
			prop.InitialValue = attr.Value
			if attr.Unit != "" {
				prop.InitialValue += " " + attr.Unit
			}
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
		err2 := binding.pubsub.PubEvent(ctx, td.ID, hubapi.EventNameTD, tdDoc)
		if err2 != nil {
			err = err2
		}
	}
	return err
}
