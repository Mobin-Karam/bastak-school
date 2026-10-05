# `@moshaver/cmb-system`

Framework-neutral system metadata primitives. Nest transport, TypeORM, SQLite inspection, backup/restore, filesystem operations, and operational policy stay in the API adapter.

## Install and use

```bash
npm install @moshaver/cmb-system
```

```js
const { isValidAppVersion, projectAuditRecord } = require("@moshaver/cmb-system");
if (!isValidAppVersion("1.0.0")) throw new Error("invalid version");
```
