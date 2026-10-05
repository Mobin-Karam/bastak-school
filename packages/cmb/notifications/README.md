# `@moshaver/cmb-notifications`

Framework-neutral notification pagination, cursor, and public-state mechanics. Persistence, student recipient resolution, realtime/push delivery, and API error localization remain adapters.

## Install and use

```bash
npm install @moshaver/cmb-notifications
```

```js
const { encodeCursor, decodeCursor, normalizePageLimit } = require("@moshaver/cmb-notifications");
const limit = normalizePageLimit(50);
```
