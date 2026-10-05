# @moshaver/cmb-health

Framework-neutral health/readiness capability. Applications provide named probes and decide how failures map to HTTP, process, orchestration, or platform-specific behavior.

## Install and use

```bash
npm install @moshaver/cmb-health
```

```js
const { CmbHealthService } = require("@moshaver/cmb-health");
const health = new CmbHealthService({ serviceName: "api", probes: [] });
await health.ready();
```
