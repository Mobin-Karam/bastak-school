"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createCmbRuntime, normalizeConfig } = require("../src");

test("creates a ready runtime from one declarative configuration", async () => {
  const runtime = createCmbRuntime({
    serviceName: "notes-api",
    modules: ["auth", "notifications", "realtime"],
  });
  assert.deepEqual(runtime.metadata().map((module) => module.id), ["kernel", "health", "identity", "auth", "notifications", "realtime"]);
  assert.deepEqual(await runtime.ready(), { modules: "ready" });
});

test("rejects unknown module ids and empty names", () => {
  assert.throws(() => normalizeConfig({ modules: ["unknown"] }), /built-in or registered CMB module ids/);
  assert.throws(() => normalizeConfig({ serviceName: "   " }), /must not be empty/);
});
