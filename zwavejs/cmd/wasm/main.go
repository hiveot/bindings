//go:build js

package main

import (
	"fmt"
	"syscall/js"
	"time"

	"github.com/hiveot/bindings/zwavejs/cmd/wasm/wsjs"
)

var wait = make(chan bool)

// Main provides capnp pub/sub methods for use by javascript.
func main() {
	// logrus.SetReportCaller(true)
	hapi := wsjs.NewHubAPI("zwavejs")
	// Register the Go Gateway API for use by JS
	js.Global().Set("connect", js.FuncOf(hapi.Connect))
	js.Global().Set("login", js.FuncOf(hapi.Login))
	js.Global().Set("pubTD", js.FuncOf(hapi.PubTD))
	js.Global().Set("pubEvent", js.FuncOf(hapi.PubEvent))
	js.Global().Set("pubProperties", js.FuncOf(hapi.PubProperties))
	js.Global().Set("subAction", js.FuncOf(hapi.SubAction))
	js.Global().Set("gostop", js.FuncOf(gostop))
	time.Sleep(time.Millisecond * 100)

	// Prevent the program from exit
	<-wait
	fmt.Println("stopped")
}

func gostop(this js.Value, args []js.Value) any {
	go func() {
		wait <- true
		fmt.Println("stopping")
	}()
	return true
}
