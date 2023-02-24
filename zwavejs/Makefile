# Makefile to build the zwave protocol binding
DIST_FOLDER=./dist
BUILD_FOLDER=./build
INSTALL_HOME=~/bin/hiveot
BINDINGS_HOME=$(INSTALL_HOME)/bin/bindings
.DEFAULT_GOAL := help

.FORCE:

all: wasm js

build: .FORCE  ## Compile typescript and bundle into binary package
	yarn build

wasm: ## Compile go to wasm
	GOOS=js GOARCH=wasm go build -o ${BUILD_FOLDER}/hapi.wasm cmd/hapi/main.go


js:  ## Compile typescript to javascript
	tsc

clean: ## Clear build and cache
	rm -f dist/*
	go clean

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  all ## Install the plugin into $(INSTALL_HOME)
	mkdir -p $(BINDINGS_HOME)
	cp $(DIST_FOLDER)/bin/* $(BINDINGS_HOME)

run: wasm js ## Compile and run the app
	node ${BUILD_FOLDER}/main.js  ~/bin/hiveot/certs

test: ## Run tests
	GOOS=js GOARCH=wasm go test -failfast  -cover ./...

upgrade: ## Upgrade packages (use with care)
	go get -u all
	go mod tidy
