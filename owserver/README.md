# OWServer

HiveOT 1-wire protocol binding for OWServer gateway


## Status

This binding is in development.

## Summary

The OWServer binding discovers and connects to 1-wire gateways to read information from connected 1-wire devices. 

This binding:
* is implemented in golang.
* uses the owserver REST API to retrieve information.
* connects to the hiveot pub/sub service via the resolver or the gateway, using the capnp protocol.
* publishes TD documents for connected devices
* publishes updates sensor values periodically and on change.
* has configuration to:
  * set owserver address or use mdns discovery
  * set credentials to access the 1-wire gateway 
  * enable/disable 1-wire sensor publications
  * set the poll interval 
  * set the check and publication periods
  * set the value change needed to automatically publish changed values
  * change the name of a sensor
  * set the location of a sensor

This binding does not:
* use snmp traps to get notifications
