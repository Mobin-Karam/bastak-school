"use strict";

const { CmbModuleRegistry, defineModule } = require("@moshaver/cmb-kernel");
const { HEALTH_MODULE, CmbHealthService } = require("@moshaver/cmb-health");
const { PERSISTENCE_MODULE } = require("@moshaver/cmb-persistence");
const { INFRASTRUCTURE_MODULE } = require("@moshaver/cmb-infrastructure");
const { REALTIME_MODULE } = require("@moshaver/cmb-realtime");
const { IDENTITY_MODULE } = require("@moshaver/cmb-identity");
const { TENANCY_MODULE } = require("@moshaver/cmb-tenancy");
const { SYSTEM_MODULE } = require("@moshaver/cmb-system");
const { AUTH_MODULE } = require("@moshaver/cmb-auth");
const { AUTHORIZATION_MODULE } = require("@moshaver/cmb-authorization");
const { NOTIFICATIONS_MODULE } = require("@moshaver/cmb-notifications");
const { ACTIVITY_MODULE } = require("@moshaver/cmb-activity");
const { DATA_TRANSFER_MODULE } = require("@moshaver/cmb-data-transfer");

const STARTER_MODULE = defineModule({
  id: "starter",
  version: "0.1.0",
  kind: "platform",
  dependencies: [
    "activity", "auth", "authorization", "data-transfer", "health", "identity",
    "infrastructure", "kernel", "notifications", "persistence", "realtime", "system", "tenancy",
  ],
  provides: ["cmb.runtime"],
});

const builtInModules = Object.freeze({
  health: HEALTH_MODULE,
  persistence: PERSISTENCE_MODULE,
  infrastructure: INFRASTRUCTURE_MODULE,
  realtime: REALTIME_MODULE,
  identity: IDENTITY_MODULE,
  tenancy: TENANCY_MODULE,
  system: SYSTEM_MODULE,
  auth: AUTH_MODULE,
  authorization: AUTHORIZATION_MODULE,
  notifications: NOTIFICATIONS_MODULE,
  activity: ACTIVITY_MODULE,
  "data-transfer": DATA_TRANSFER_MODULE,
});

function normalizeConfig(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("CMB configuration must be an object.");
  }
  const serviceName = String(input.serviceName ?? "cmb-service").trim();
  if (!serviceName) throw new TypeError("config.serviceName must not be empty.");
  const registrations = input.registrations ?? [];
  if (!Array.isArray(registrations)) throw new TypeError("config.registrations must be an array.");
  const registeredIds = new Set(registrations.map((entry) => entry?.descriptor?.id ?? entry?.id));
  const modules = input.modules ?? ["health"];
  if (!Array.isArray(modules) || modules.some((id) => typeof id !== "string" || (!builtInModules[id] && !registeredIds.has(id)))) {
    throw new TypeError("config.modules must contain built-in or registered CMB module ids.");
  }
  return Object.freeze({ serviceName, modules: [...new Set(["health", ...modules])], registrations });
}

function createCmbRuntime(config) {
  const normalized = normalizeConfig(config);
  const registrations = [...Object.values(builtInModules), ...normalized.registrations];
  const registry = new CmbModuleRegistry(registrations);
  const descriptors = new Map(
    registrations.map((entry) => {
      const descriptor = entry?.descriptor ?? entry;
      return [descriptor.id, descriptor];
    }),
  );
  const enabled = new Set(["kernel"]);
  const include = (id) => {
    if (enabled.has(id)) return;
    const descriptor = descriptors.get(id);
    if (!descriptor) throw new Error(`CMB module ${id} is not registered.`);
    enabled.add(id);
    for (const dependency of descriptor.dependencies ?? []) include(dependency);
  };
  for (const id of normalized.modules) include(id);
  const enabledModules = [...enabled];
  const health = new CmbHealthService({
    serviceName: normalized.serviceName,
    probes: [{ name: "modules", check: () => registry.resolve(enabledModules) }],
  });
  return Object.freeze({
    config: normalized,
    registry,
    health,
    metadata: () => registry.metadata(enabledModules),
    ready: () => health.ready(),
    start: async (context = {}) => registry.start({ ...context, health }, enabledModules),
    stop: async (context = {}) => registry.stop({ ...context, health }),
  });
}

module.exports = { STARTER_MODULE, builtInModules, normalizeConfig, createCmbRuntime };
