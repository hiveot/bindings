module github.com/hiveot/bindings/owserver

go 1.19

require (
	capnproto.org/go/capnp/v3 v3.0.0-alpha.24
	github.com/hiveot/hub v0.0.0-20230225055025-2dbb9b760fdc
	github.com/sirupsen/logrus v1.9.0
	github.com/stretchr/testify v1.8.2
)

require (
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/gobwas/httphead v0.1.0 // indirect
	github.com/gobwas/pool v0.2.1 // indirect
	github.com/gobwas/ws v1.1.0 // indirect
	github.com/google/uuid v1.3.0 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	go.uber.org/atomic v1.10.0 // indirect
	go.uber.org/multierr v1.9.0 // indirect
	go.uber.org/zap v1.24.0 // indirect
	golang.org/x/sync v0.1.0 // indirect
	golang.org/x/sys v0.5.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	zenhack.net/go/websocket-capnp v0.0.0-20230212023810-f179b8b2c72b // indirect
)

replace github.com/hiveot/hub => ../../hub
