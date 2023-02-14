// Copyright 2021 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.


// if (process.argv.length < 3) {
//     console.error("usage: go_js_wasm_exec [wasm binary] [arguments]");
//     process.exit(1);
// }
//
// const fs = require("fs")
// const crypto = require("crypto");

import fs from "fs"
import crypto from "crypto"
import util from "util"
import os from "os"

// polyfills for running in nodejs
// globalThis.require = require;  // 
globalThis.fs = fs;
globalThis.TextEncoder = util.TextEncoder;
globalThis.TextDecoder = util.TextDecoder;

globalThis.crypto = {
    getRandomValues(b) {
        crypto.randomFillSync(b);
    },
};

// import wasm_exec after setting globalThis. Use import function.
await import("./wasm_exec.js")

const go = new globalThis.Go();


// go.argv = process.argv.slice(2);
go.env = Object.assign({ TMPDIR: os.tmpdir() }, process.env);
go.exit = process.exit;

export const loadWasm = async function (fileName) {
    console.log("loading wasm file " + fileName)
    let wasmdata = fs.readFileSync(fileName)

    WebAssembly.instantiate(wasmdata, go.importObject)
        .then((result) => {
            process.on("exit", (code) => { // Node.js exits if no event handler is pending
                if (code === 0 && !go.exited) {
                    // deadlock, make Go print error and stack traces
                    go._pendingEvent = { id: 0 };
                    go._resume();
                }
            });
            return go.run(result.instance);
        }).catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
