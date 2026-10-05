# `@moshaver/cmb-authorization`

Framework-neutral capability and organization-context evaluation. Student ownership, Moshaver relationships, entity loading, and transport denials remain product/application policy adapters.

## Install and use

```bash
npm install @moshaver/cmb-authorization
```

```js
const { buildAuthorizationContext, hasCapability } = require("@moshaver/cmb-authorization");
const context = buildAuthorizationContext(base, assignments, memberships);
if (!hasCapability(context, "notes.read")) throw new Error("forbidden");
```
