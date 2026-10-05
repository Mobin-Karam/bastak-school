# `@moshaver/cmb-identity`

Framework-neutral identity value mechanics. Password hashing, sessions, persistence, transport errors, and product role policy remain application adapters.

## Install and use

```bash
npm install @moshaver/cmb-identity
```

```js
const { normalizeUsername, projectCapabilities } = require("@moshaver/cmb-identity");
const username = normalizeUsername(" Example_User ");
```
