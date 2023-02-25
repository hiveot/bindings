module github.com/hiveot/bindings/zwavejs

go 1.19

require (
	capnproto.org/go/capnp/v3 v3.0.0-alpha.24
	github.com/hiveot/hub v0.0.0-20230207180321-215941d87c3c
	github.com/sirupsen/logrus v1.9.0
	zenhack.net/go/websocket-capnp v0.0.0-20230212023810-f179b8b2c72b
)

require (
	github.com/gobwas/httphead v0.1.0 // indirect
	github.com/gobwas/pool v0.2.1 // indirect
	github.com/gobwas/ws v1.1.0 // indirect
	golang.org/x/net v0.6.0 // indirect
	golang.org/x/sync v0.1.0 // indirect
	golang.org/x/sys v0.5.0 // indirect
)

replace github.com/hiveot/hub => ../../hub

replace zenhack.net/go/websocket-capnp => ../../../go-websocket-capnp
