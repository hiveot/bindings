// Package internal handles node configuration commands
package internal

// HandleConfigRequest handles requests to update a Thing's configuration
// There are currently no node configurations to update to onewire
//func (binding *OWServerBinding) HandleConfigRequest(propName string, io *thing.InteractionOutput) error {
//	// logrus.Infof("Thing %s. propName=%s", eThing.GetThingDescription().GetID(), propName)
//	// for now accept all configuration
//
//	// If the property name is converted to a standardized vocabulary then convert the name
//	// to the EDS writable property name.
//	edsName := eds.LookupEdsName(propName)
//
//	err := binding.edsAPI.WriteData(eThing.DeviceID, edsName, io.ValueAsString())
//	if err == nil {
//		time.Sleep(time.Second)
//		err = binding.UpdatePropertyValues(true)
//		// The EDS is slow, retry in case it was missed
//		time.Sleep(time.Second * 2)
//		err = binding.UpdatePropertyValues(true)
//	} else {
//		logrus.Error(err)
//	}
//	return err
//}
