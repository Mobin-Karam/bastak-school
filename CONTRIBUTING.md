# Contributing to Moshaver v2 / مشارکت در مشاور v2

[English](#english) · [فارسی](#فارسی)

## English

Thanks for considering a contribution. Moshaver is a product monorepo: a change can affect the Admin app, Student app, API, shared contracts, and CMB boundaries at once. Small, source-backed changes are easier to review and safer to release.

### Before you begin

1. Read [AGENTS.md](AGENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), and the [developer handbook](docs/operations/developer-handbook.md).
2. Check the active branch, nearby tests, public contracts, and migration history before changing behavior.
3. Do not add a root lockfile or npm `workspaces` field; leaf lockfiles and [`tooling/workspace/projects.json`](tooling/workspace/projects.json) are authoritative.
4. Keep secrets, `.env` files, production data, private keys, and tokens out of commits and issue text.

### Development flow

```bash
npm run workspace:check
npm run workspace:list
npm run bootstrap
```

Work within the relevant project, preserve dependency direction, and run focused checks first. The [repository runbook](docs/operations/repository-runbook.md) lists the required validation for each surface.

### Pull-request checklist

- [ ] The change has a clear product or operational reason.
- [ ] Server-side authorization, tenant/student scope, CSRF, validation, and audit boundaries remain intact.
- [ ] UI changes cover loading, empty, error, disabled, keyboard, RTL, responsive, and capability-gated states where applicable.
- [ ] Contracts, migrations, and consumers are synchronized when an API changes.
- [ ] Tests were added or updated where practical; report the exact checks actually run.
- [ ] Documentation and release/capability notes match current behavior.
- [ ] `git diff --check` and `npm run docs:check` pass.

Use focused, coherent commits. Do not mix generated Graphify output with product changes unless it was deliberately refreshed and reviewed; if committed, keep it in its own commit.

### Security and licensing

Do not file public issues for suspected vulnerabilities. Follow [SECURITY.md](SECURITY.md).

Moshaver is distributed under the [MIT License](LICENSE). Contributions to this repository are made under the repository's license unless another agreement explicitly applies.

## فارسی

از مشارکت شما سپاسگزاریم. مشاور یک مونوریپوی محصولی است؛ یک تغییر می‌تواند هم‌زمان روی پنل Admin، اپ دانش‌آموز، API، قراردادهای اشتراکی و مرزهای CMB اثر بگذارد. تغییرهای کوچک و مستند، بازبینی و انتشار امن‌تری دارند.

### پیش از شروع

1. [AGENTS.md](AGENTS.md)، [ARCHITECTURE.md](ARCHITECTURE.md) و [راهنمای توسعه‌دهنده](docs/operations/developer-handbook.md) را بخوانید.
2. پیش از تغییر رفتار، branch فعال، تست‌های نزدیک، قراردادهای عمومی و تاریخچه migration را بررسی کنید.
3. `workspaces` در ریشه یا lockfile ریشه اضافه نکنید؛ lockfileهای سطح پروژه و [`tooling/workspace/projects.json`](tooling/workspace/projects.json) مرجع هستند.
4. secret، فایل `.env`، داده production، کلید خصوصی و token را در commit یا issue قرار ندهید.

### جریان توسعه

```bash
npm run workspace:check
npm run workspace:list
npm run bootstrap
```

در پروژه مرتبط کار کنید، جهت وابستگی را حفظ کنید و ابتدا تست‌های متمرکز را اجرا کنید. [راهنمای مخزن](docs/operations/repository-runbook.md) اعتبارسنجی لازم هر سطح را مشخص می‌کند.

### چک‌لیست Pull Request

- [ ] تغییر، دلیل روشن محصولی یا عملیاتی دارد.
- [ ] مجوزدهی سمت سرور، محدوده سازمان/دانش‌آموز، CSRF، اعتبارسنجی و ممیزی حفظ شده‌اند.
- [ ] تغییر UI در صورت نیاز حالت بارگذاری، خالی، خطا، غیرفعال، کیبورد، RTL، responsive و قابلیت‌محور را پوشش می‌دهد.
- [ ] با تغییر API، قرارداد، migration و مصرف‌کننده‌ها همگام شده‌اند.
- [ ] تست‌های لازم افزوده/به‌روز شده و فقط بررسی‌هایی گزارش شده‌اند که واقعاً اجرا شده‌اند.
- [ ] مستندات و یادداشت‌های انتشار/قابلیت با رفتار فعلی تطابق دارند.
- [ ] `git diff --check` و `npm run docs:check` موفق هستند.

Commitها را کوچک و هم‌دامنه نگه دارید. خروجی تولیدشده Graphify را فقط در صورت بازتولید و بازبینی عمدی، و در commit جداگانه اضافه کنید.

### امنیت و مجوز

آسیب‌پذیری مشکوک را در issue عمومی ثبت نکنید؛ [SECURITY.md](SECURITY.md) را دنبال کنید.

مشاور تحت [MIT License](LICENSE) منتشر شده است. مشارکت‌ها نیز تحت مجوز همین مخزن انجام می‌شوند، مگر اینکه توافق دیگری صراحتاً اعمال شود.
