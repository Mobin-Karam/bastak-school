# `@moshaver/cmb-tenancy`

Framework-neutral organization scope and platform-role policy. Persistence, product chat side effects, transport errors, and role catalogs remain application adapters.

## Install and use

```bash
npm install @moshaver/cmb-tenancy
```

```js
const { TenancyPolicy } = require("@moshaver/cmb-tenancy");
const policy = new TenancyPolicy({ platformRole: "OPERATOR" });
```
