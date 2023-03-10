package internal

import (
	"time"

	"github.com/sirupsen/logrus"
)

// heartbeat polls the EDS server every X seconds and publishes updates
func (binding *OWServerBinding) heartBeat() {
	logrus.Infof("TDinterval=%d seconds, Poll interval is %d seconds",
		binding.Config.TDInterval, binding.Config.PollInterval)
	var tdCountDown = 0
	var pollCountDown = 0
	for {
		isRunning := binding.isRunning.Load()
		if !isRunning {
			break
		}

		tdCountDown--
		pollCountDown--
		if pollCountDown <= 0 {

			nodes, err := binding.PollNodes()
			if err == nil {
				if tdCountDown <= 0 {
					// Every TDInterval update the TD's and submit all properties
					// create ExposedThing's as they are discovered
					err = binding.PublishThings(nodes)
					tdCountDown = binding.Config.TDInterval
				}

				_ = binding.PublishNodeValues(nodes)
				pollCountDown = binding.Config.PollInterval
			}
		}
		time.Sleep(time.Second)
	}
}
