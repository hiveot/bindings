#!/usr/bin/env node
import "../lib/hubapi.js";
import path from "path";
import yaml from "yaml";
import crypto from "crypto";
import * as fs from "fs";
import {exit} from "process";
import {program} from "commander";

import {HubAPI} from "../lib/hubapi.js";

//--- Step 2: Start the zwave-js binding
import {BindingConfig, ZwaveBinding} from "./binding.js"

// TODO: move these to a library

// the application binary lives in {home}/bin/services
let appDir = path.dirname(path.dirname(path.dirname(process.argv[1])))
let gwURL = "wss://127.0.0.1:8444/"

program
    .name('zwavejs')
    .description("HiveOT binding for the zwave protocol using zwavejs")
    .option('--gateway <string>', "websocket address and port of the HiveOT gateway", gwURL)
    .option('--home <string>', "path to the HiveOT home directory", appDir)
    .option('--certs <string>', "override service auth certificate directory", "./certs")
    .option('--logs <string>', "override log-files directory", "./logs")
    .option('--config <string>', "override config directory ", "./config")
    .option('--stores <string>', "override storage directory", "./stores")

program.parse();
const options = program.opts()
let homeDir = options.home

// optional override of certs, logs, config and data directories
let certsDir = path.isAbsolute(options.certs) ? options.certs : path.join(homeDir, options.certs)
let logsDir = path.isAbsolute(options.logs) ? options.logs : path.join(homeDir, options.logs)
let configDir = path.isAbsolute(options.config) ? options.config : path.join(homeDir, options.config)
let storesDir = path.isAbsolute(options.stores) ? options.stores : path.join(homeDir, options.stores)
gwURL = (options.gateway != gwURL) ? options.gateway : gwURL

let appConfig = loadConfig("zwavejs", configDir)


console.log("binding startup. homeDir=" + homeDir + ", connecting to gateway ", gwURL)

function loadCerts(certsDir: string): [clientCertPem: string, clientKeyPem: string, caCertPem: string] {

    let clientCertFile = certsDir + "/zwavejsCert.pem"
    let clientKeyFile = certsDir + "/zwavejsKey.pem"
    let caCertFile = certsDir + "/caCert.pem"

    let clientCertPem = fs.readFileSync(clientCertFile)
    let clientKeyPem = fs.readFileSync(clientKeyFile)
    let caCertPem = fs.readFileSync(caCertFile)

    return [clientCertPem.toString(), clientKeyPem.toString(), caCertPem.toString()]
}

// Load the binding configuration  from <binding>.yaml
// if the configfile does not exist, create it with the given default config
function loadConfig(bindingName: string, configDir: string): BindingConfig {
    let fullpath = path.join(configDir, bindingName + ".yaml")
    try {
        let cfgData = fs.readFileSync(fullpath)
        let loadedConfig = yaml.parse(cfgData.toString())
        return loadedConfig
    } catch {
        // config file doesn't exist. Generate one
        let cfgYaml = "# ZwaveJS binding configuration file\n\n" +
            "# Optionally write discovered value ID's to a csv file. Intended for troubleshooting.\n" +
            "#vidCsvFile: " + path.join(logsDir, "zwinfo.csv") + "\n" +
            "\n" +
            "# ZWave S2 security keys. 16 Byte hex strings\n" +
            "# Keep these secure to protect your network:\n" +
            "S2_Unauthenticated: " + crypto.randomBytes(16).toString("hex") + "\n" +
            "S2_Authenticated: " + crypto.randomBytes(16).toString("hex") + "\n" +
            "S2_AccessControl: " + crypto.randomBytes(16).toString("hex") + "\n" +
            "S2_Legacy: " + crypto.randomBytes(16).toString("hex") + "\n" +
            "\n" +
            "# Serial port of ZWave USB controller. Default is automatic.\n" +
            "#zwPort: /dev/ttyACM0\n" +
            "\n" +
            "# Optional logging of zwavejs driver\n" +
            "# error, warn, http, info, verbose, or debug\n" +
            "#zwLogFile: " + path.join(logsDir, "zwavejs-driver.log") + "\n" +
            "zwLogLevel: warn\n" +
            "\n" +
            "# Location where the ZWavejs driver stores its data\n" +
            "cacheDir: " + path.join(storesDir, "zwavejs") + "\n" +
            ""

        fs.writeFileSync(fullpath, cfgYaml)
        let newCfg = yaml.parse(cfgYaml)
        return newCfg
    }
}

//--- Step 1: Initialize the Hub connection
var hapi = new HubAPI()
await hapi.initialize()
let [clientCertPem, clientKeyPem, caCertPem] = loadCerts(certsDir)
await hapi.connect(gwURL, clientCertPem, clientKeyPem, caCertPem)

let binding = new ZwaveBinding(hapi, appConfig);
await binding.start();


// When the application gets a SIGINT or SIGTERM signal
// Shutting down after SIGINT is optional, but the handler must exist
console.log("Ready. Waiting for signal to terminate")
for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
        gostop();
        await binding.stop();
        exit(0);
    });
}

