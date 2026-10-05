# @moshaver/cmb-realtime

Framework-neutral in-memory realtime hub. It owns subscription/event mechanics, while Nest/RxJS/SSE and Moshaver-specific event names remain application adapters.

## Install and use

```bash
npm install @moshaver/cmb-realtime
```

```js
const { InMemoryRealtimeHub } = require("@moshaver/cmb-realtime");
const hub = new InMemoryRealtimeHub();
```
