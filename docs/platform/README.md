# Moshaver Open Platform

**Moshaver Open Platform** is the public platform identity for this repository.
It is an MIT-licensed, self-hostable foundation for secure, multi-organization
operations software. **Moshaver Education** is the first product built on it.

The name is an umbrella descriptor, not a breaking rename: existing repository
names, package names, URLs, and API contracts retain `moshaver` for
compatibility.

## What it is

The platform provides reusable mechanisms that most operational systems need:

- identity, sessions, roles, capabilities, and tenant/work-context evaluation;
- health/readiness, audit/activity, realtime events, and notifications;
- deterministic migrations, replaceable infrastructure ports, and safe data
  transfer mechanics;
- a reference application and starter for assembling a new service;
- versioned application APIs, web/PWA/native delivery patterns, and a
  testable modular-monolith baseline.

It does **not** claim to be a finished generic ERP, CRM, or no-code platform.
Each system must own its domain model, persistence policy, authorization rules,
and user experience.

## How to use it

### Run the education product

Follow the repository [Quick start](../../README.md#quick-start) to run the
Admin, Student, and API applications with Docker Compose or local Node.js.

### Build a new service on CMB

Create a new in-repository service from the supported generator:

```bash
npm run generate:cmb-app -- --target=apps/inventory-service --name=inventory-service
cd apps/inventory-service
npm install
npm test
```

The result is a generic notes-service baseline with sessions, CSRF protection,
health/readiness, module metadata, notifications, realtime, and deterministic
migrations. Replace the example product module with your domain module; retain
the security and dependency boundaries.

For a smaller integration, use the runtime starter:

```bash
npm install @moshaver/cmb-starter
```

```js
const { createCmbRuntime } = require("@moshaver/cmb-starter");

const cmb = createCmbRuntime({
  serviceName: "inventory-api",
  modules: ["auth", "authorization", "notifications", "realtime"],
});

await cmb.start();
await cmb.ready();
```

The starter intentionally does not create transport routes, database adapters,
secrets, or product policy. See the [CMB release and compatibility policy](../architecture/cmb-reference-and-release.md)
before publishing or depending on packages outside this monorepo.

## Adopt safely

1. Begin with the modular monolith and one deployable API.
2. Model roles/capabilities and organization scope on the server; never rely on
   UI filtering for access control.
3. Use package-root public entrypoints only. CMB must not import application or
   product code.
4. Keep migrations module-owned and test migration-from-zero before release.
5. Choose adapters deliberately: default SQLite deployments require one API
   replica and persistent storage; PostgreSQL needs a tested adapter migration.
6. Run the documented architecture, contract, package, and application checks.

## Roadmap

The roadmap separates available capabilities from planned work. See
[Platform roadmap](ROADMAP.md) for scope, extension rules, and acceptance gates.

## Community

- [Contributing](../../CONTRIBUTING.md)
- [Code of Conduct](../../CODE_OF_CONDUCT.md)
- [Security policy](../../SECURITY.md)
- [Support](../../SUPPORT.md)
- [Architecture](../architecture/repository-architecture.md)

