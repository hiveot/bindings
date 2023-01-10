// Package internal handles input set command
package internal

import (
	"time"

	"github.com/sirupsen/logrus"

	"github.com/hiveot/bindings/owserver/internal/eds"
	"github.com/hiveot/hub.capnp/go/vocab"
	"github.com/hiveot/hub/lib/thing"
)

// HandleActionRequest handles requests to activate inputs
func (binding *OWServerBinding) HandleActionRequest(action *thing.ThingValue) {
	var attr eds.OneWireAttr
	logrus.Infof("Pub=%s, Thing=%s. Action=%s Value=%s",
		action.PublisherID, action.ThingID, action.Name, action.ValueJSON)

	// If the action name is converted to a standardized vocabulary then convert the name
	// to the EDS writable property name.

	// which node is this action for?
	deviceID := action.ThingID

	// lookup the action name used by the EDS
	edsName := eds.LookupEdsName(action.Name)

	// determine the value. Booleans are submitted as integers
	actionValue := action.ValueJSON

	node, found := binding.nodes[deviceID]
	if found {
		attr, found = node.Attr[action.Name]
	}
	if !found {
		logrus.Warningf("action '%s' on unknown attribute '%s'", action.Name, attr.Name)
		return
	} else if !attr.Writable {
		logrus.Warningf("action '%s' on read-only attribute '%s'", action.Name, attr.Name)
		return
	}
	// TODO: type conversions needed?
	if attr.DataType == vocab.WoTDataTypeBool {
		//actionValue = fmt.Sprint(ValueAsInt())
	}
	err := binding.edsAPI.WriteData(deviceID, edsName, string(actionValue))

	// read the result
	time.Sleep(time.Second)
	_ = binding.RefreshPropertyValues(true)

	// Writing the EDS is slow, retry in case it was missed
	time.Sleep(time.Second * 4)
	_ = binding.RefreshPropertyValues(true)

	if err != nil {
		logrus.Warningf("action '%s' failed: %s", action.Name, err)
	}
}
