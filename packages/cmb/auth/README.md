# `@moshaver/cmb-auth`

Framework-neutral login normalization and secure session credential lifecycle. Account/student eligibility, password hashing, persistence, throttling, and HTTP/CSRF error mapping remain in the API adapter.

## Install and use

```bash
npm install @moshaver/cmb-auth
```

```js
const { SessionCredentialService, InMemorySessionStore } = require("@moshaver/cmb-auth");
// Use a durable host store instead of InMemorySessionStore in production.
```
