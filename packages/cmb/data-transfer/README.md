# `@moshaver/cmb-data-transfer`

Generic security-field rejection and import normalization helpers. Moshaver schema `2.0`, plan/exam codecs, entity persistence, authorization, and history records remain product-owned.

## Install and use

```bash
npm install @moshaver/cmb-data-transfer
```

```js
const { containsForbiddenFields, summarizeCollections } = require("@moshaver/cmb-data-transfer");
if (containsForbiddenFields(payload)) throw new Error("unsafe import");
```
