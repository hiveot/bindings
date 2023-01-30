#!/usr/bin/env node

import ZwaveBinding from "./binding";

let binding = new ZwaveBinding();

// When the application gets a SIGINT or SIGTERM signal
// Shutting down after SIGINT is optional, but the handler must exist
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    binding.stop();
  });
}

binding.start();
