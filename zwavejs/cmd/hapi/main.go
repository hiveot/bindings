//go:build js

package main

import (
	"syscall/js"

	"github.com/hiveot/bindings/zwavejs/cmd/hapi/wsjs"
)

var wait = make(chan bool)

// Gomain provides capnp pub/sub methods for use by javascript.
func Gomain() {
	// logrus.SetReportCaller(true)
	println("Entering Gomain")
	hapi := wsjs.NewHubAPI("zwavejs")
	// Register the Go Gateway API for use by JS
	js.Global().Set("connect", js.FuncOf(hapi.Connect))
	js.Global().Set("login", js.FuncOf(hapi.Login))
	js.Global().Set("pubTD", js.FuncOf(hapi.PubTD))
	js.Global().Set("pubEvent", js.FuncOf(hapi.PubEvent))
	js.Global().Set("pubProperties", js.FuncOf(hapi.PubProperties))
	js.Global().Set("subActions", js.FuncOf(hapi.SubActions))
	js.Global().Set("gostop", js.FuncOf(Gostop))
	//time.Sleep(time.Millisecond * 100)

	// Prevent the program from exit
	<-wait
	println("Gomain has stopped")
}

func Gostop(this js.Value, args []js.Value) any {
	go func() {
		wait <- true
		println("Stopping Gomain")
	}()
	return true
}

func main() {
	Gomain()
}
