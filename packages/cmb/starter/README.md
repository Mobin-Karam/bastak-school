# @moshaver/cmb-starter

[English](#english) | [فارسی](#فارسی)

## English

`@moshaver/cmb-starter` creates a framework-neutral CMB runtime from one small
configuration object. It resolves module dependencies, exposes lifecycle and
readiness APIs, and leaves HTTP transport, database drivers, secrets, routes,
and product policy to the host application.

```bash
npm install @moshaver/cmb-starter
```

Create one `cmb.config.cjs` file:

```js
module.exports = {
  serviceName: "notes-api",
  modules: ["auth", "authorization", "notifications", "realtime"],
};
```

Load it at the application's composition root:

```js
const config = require("./cmb.config.cjs");
const { createCmbRuntime } = require("@moshaver/cmb-starter");

const cmb = createCmbRuntime(config);
await cmb.start();
await cmb.ready();
```

Dependencies such as `identity` and `tenancy` are resolved automatically. Add
your own product module descriptors through `registrations`; keep product
routes, roles, storage adapters, and secrets outside this package.

## فارسی

پکیج `@moshaver/cmb-starter` با یک شیء پیکربندی کوچک، runtime مستقل از
فریم‌ورک CMB را می‌سازد. وابستگی ماژول‌ها، چرخهٔ اجرا و وضعیت آماده‌بودن را
مدیریت می‌کند؛ اما HTTP، درایور پایگاه‌داده، رازها، مسیرها و قوانین محصول
همچنان مسئولیت برنامهٔ میزبان هستند.

```bash
npm install @moshaver/cmb-starter
```

یک فایل `cmb.config.cjs` بسازید:

```js
module.exports = {
  serviceName: "notes-api",
  modules: ["auth", "authorization", "notifications", "realtime"],
};
```

سپس آن را در composition root برنامه بارگذاری کنید:

```js
const config = require("./cmb.config.cjs");
const { createCmbRuntime } = require("@moshaver/cmb-starter");

const cmb = createCmbRuntime(config);
await cmb.start();
await cmb.ready();
```

وابستگی‌هایی مانند `identity` و `tenancy` خودکار حل می‌شوند. descriptorهای
محصول خود را با `registrations` اضافه کنید و مسیرها، نقش‌ها، adapterهای ذخیره‌سازی
و رازهای محصول را بیرون از این پکیج نگه دارید.
