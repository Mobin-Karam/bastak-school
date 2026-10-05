# @moshaver/cmb-kernel

Small runtime-neutral CMB foundation primitives. This package defines module descriptors and stable tokens only; it has no Moshaver product or framework dependency.

## Install and use

```bash
npm install @moshaver/cmb-kernel
```

```js
const { CmbModuleRegistry, defineModule } = require("@moshaver/cmb-kernel");
const modules = new CmbModuleRegistry([
  defineModule({ id: "notes", version: "0.1.0", kind: "product" }),
]);
```

Import only from the package root; do not deep-import implementation files.
