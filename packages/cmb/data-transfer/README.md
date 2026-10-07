# `@moshaver/cmb-data-transfer`

Generic security-field rejection, row-boundary validation, and import normalization helpers. Moshaver schema `2.0`, Excel codecs, entity persistence, authorization, and history records remain product-owned.

## Install and use

```bash
npm install @moshaver/cmb-data-transfer
```

```js
const {
  validateTransferRows,
  summarizeCollections,
} = require("@moshaver/cmb-data-transfer");
const errors = validateTransferRows(payload.rows, { maxRows: 500 });
if (errors.length) throw new Error(errors[0]);
```

Each product feature owns its explicit column schema, DTO validation, tenant authorization,
preview/conflict policy, transaction, audit history, and export projection. Do not create a
generic endpoint that accepts an entity/table name from the client.
