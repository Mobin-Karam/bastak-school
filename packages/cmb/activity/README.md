# `@moshaver/cmb-activity`

Generic presence normalization, heartbeat de-duplication, projection, and activity paging. Moshaver event vocabulary, student/task persistence, attention signals, and access policy remain product-owned.

## Install and use

```bash
npm install @moshaver/cmb-activity
```

```js
const { normalizePresenceState, shouldPersistPresence } = require("@moshaver/cmb-activity");
const state = normalizePresenceState("online");
```
