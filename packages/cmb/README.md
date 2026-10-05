# CMB packages | پکیج‌های CMB

[English](#english) | [فارسی](#فارسی)

## English

Reusable packages for **Composable Modular Backend (CMB) Architecture**.

> CMB is the framework-neutral backend layer below a product application. It is
> not an HTTP framework, ORM, or education-domain SDK. The host owns transport,
> concrete adapters, product policy, and secret configuration.

Rules:

- CMB packages must not import Moshaver product/application code.
- Public APIs are package entrypoints; consumers must not deep-import implementations.
- Kernel/foundation/platform code stays framework-neutral unless a package is explicitly an infrastructure/transport adapter.
- Product-specific event names, roles, persistence entities, and HTTP routes remain outside reusable packages.
- Every extraction must preserve existing application behavior through adapter/compatibility tests.

Current Phase-3 packages:

- `kernel` — module descriptors/tokens plus dependency and lifecycle registry;
- `health` — generic liveness/readiness probes;
- `persistence` — deterministic module-owned migrations and unit-of-work contract;
- `infrastructure` — replaceable adapter inventory/readiness and local defaults;
- `realtime` — generic in-memory user event hub;
- `identity` — identity normalization and capability projection;
- `tenancy` — organization scoping and platform-role policy;
- `system` — application-version and audit-record primitives.
- `auth` — secure session credential lifecycle;
- `authorization` — capability and work-context evaluation;
- `notifications` — notification cursor, paging, and public-state mechanics.
- `activity` — presence heartbeat and activity paging mechanics;
- `data-transfer` — generic secure import normalization mechanics.
- `starter` — one-file runtime configuration and dependency-aware bootstrap.

See the executable, non-education [`apps/cmb-reference`](../../apps/cmb-reference)
service and the [compatibility/release policy](../../docs/architecture/cmb-reference-and-release.md).

## Use CMB in an application

Install only the packages your application needs. A host should depend on the
package-root entrypoints; do not deep-import `src/` files.

For the quickest framework-neutral bootstrap, use the starter and one config
file. It resolves CMB module dependencies, but it deliberately does not create
HTTP routes, database drivers, secrets, or product policy for you:

```bash
npm install @moshaver/cmb-starter
```

```js
// cmb.config.cjs
module.exports = {
  serviceName: "notes-api",
  modules: ["auth", "authorization", "notifications", "realtime"],
};
```

```js
const { createCmbRuntime } = require("@moshaver/cmb-starter");
const cmb = createCmbRuntime(require("./cmb.config.cjs"));
await cmb.start();
await cmb.ready();
```

See [`@moshaver/cmb-starter`](./starter) for configuration, custom product
module registrations, and the host-application boundary.

```bash
npm install @moshaver/cmb-kernel @moshaver/cmb-health
```

Register modules at the application composition root, then inject or compose
their public services through adapters:

```js
const { CmbModuleRegistry } = require("@moshaver/cmb-kernel");
const { HEALTH_MODULE, CmbHealthService } = require("@moshaver/cmb-health");

const health = new CmbHealthService({
  serviceName: "notes-api",
  probes: [{ name: "store", check: async () => {} }],
});
const modules = new CmbModuleRegistry([HEALTH_MODULE]);

await modules.start({ health });
console.log(await health.ready());
```

For identity, tenancy, authorization, notifications, persistence, realtime,
activity, and transfer mechanics, use the corresponding package root. Keep
roles, entities, recipient rules, database tables, HTTP errors, and framework
adapters in the host product.

## Local development versus npm artifacts

The monorepo intentionally uses leaf lockfiles and local `file:` dependencies.
Those links keep source development atomic but are not valid registry dependency
coordinates. `npm run cmb:pack` creates disposable `dist/cmb-npm/` artifacts,
rewrites only their internal dependencies to compatible semver ranges, and runs
`npm pack --dry-run` for every package. It never modifies source manifests and
never publishes.

```bash
npm run cmb:publish:check  # validate source release prerequisites
npm run cmb:pack           # stage and dry-run pack all CMB packages
```

This repository is MIT-licensed. The staged artifacts are public-release ready
only when their package metadata, public API, compatibility checks, and
release gates pass; `npm run cmb:pack` still never publishes them. Stage MIT
artifacts with `CMB_LICENSE=MIT npm run cmb:pack`; the generated artifacts then
include the root `LICENSE` file and declare `MIT` in their package metadata.
See the [release policy](../../docs/architecture/cmb-reference-and-release.md)
for compatibility, migration, and publishing gates.

## فارسی

CMB یک لایهٔ backend قابل‌ترکیب و مستقل از فریم‌ورک است که زیر برنامهٔ محصول
قرار می‌گیرد. CMB فریم‌ورک HTTP، ORM یا SDK مخصوص حوزهٔ آموزشی نیست. transport،
adapterهای واقعی، قوانین محصول و پیکربندی رازها همچنان متعلق به برنامهٔ میزبان‌اند.

برای شروع سریع، تنها یک پکیج نصب و یک فایل پیکربندی بسازید. starter وابستگی
ماژول‌ها را حل می‌کند، اما عمداً routeهای HTTP، درایور دیتابیس، رازها یا منطق
تجاری محصول را تولید نمی‌کند:

```bash
npm install @moshaver/cmb-starter
```

```js
// cmb.config.cjs
module.exports = {
  serviceName: "notes-api",
  modules: ["auth", "authorization", "notifications", "realtime"],
};
```

```js
const { createCmbRuntime } = require("@moshaver/cmb-starter");
const cmb = createCmbRuntime(require("./cmb.config.cjs"));
await cmb.start();
await cmb.ready();
```

برای پیکربندی کامل و اضافه‌کردن descriptorهای محصول به
[`@moshaver/cmb-starter`](./starter) مراجعه کنید. از entrypoint عمومی پکیج‌ها
استفاده کنید و هرگز از `src/` deep import نگیرید.
