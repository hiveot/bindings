module github.com/hiveot/bindings/owserver

go 1.19

require (
	github.com/hiveot/hub v0.0.0-20230101070052-531fe772b59a
	github.com/hiveot/hub.capnp v0.0.0-20230101070052-7cb95f4f5435
	github.com/sirupsen/logrus v1.9.0
	github.com/stretchr/testify v1.8.0
)

require (
	capnproto.org/go/capnp/v3 v3.0.0-alpha.9 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/google/uuid v1.3.0 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	go.uber.org/atomic v1.10.0 // indirect
	go.uber.org/multierr v1.8.0 // indirect
	go.uber.org/zap v1.23.0 // indirect
	golang.org/x/sync v0.1.0 // indirect
	golang.org/x/sys v0.0.0-20220825204002-c680a09ffe64 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

replace github.com/hiveot/hub => ../../hub

replace github.com/hiveot/hub.capnp => ../../hub.capnp
