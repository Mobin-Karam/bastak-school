# `@moshaver/cmb-persistence`

Framework-neutral migration ownership and transaction contracts. Each migration
uses `module:YYYYMMDDHHMMSS:name`, declares dependencies explicitly, and is ordered
deterministically. Database-specific execution remains in a host adapter.

## Install and use

```bash
npm install @moshaver/cmb-persistence
```

```js
const { defineMigration, CmbMigrationRegistry } = require("@moshaver/cmb-persistence");
const migrations = new CmbMigrationRegistry();
```
