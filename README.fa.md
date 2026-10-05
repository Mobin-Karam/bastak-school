<p align="center">
  <img src="docs/assets/moshaver-readme-hero.svg" alt="مشاور v2 — پلتفرم آموزشی نقش‌محور" width="100%" />
</p>

<h1 align="center">مشاور v2</h1>

<p align="center">
  <strong>برنامه‌ریزی · یادگیری · ارتباط · سنجش</strong><br />
  پلتفرم نقش‌محور مدیریت و پشتیبانی آموزشی برای تیم‌های آموزشی، مشاوران، دانش‌آموزان و خانواده‌ها.
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.fa.md"><strong>فارسی</strong></a> ·
  <a href="SHOWCASE.md">نمای محصول</a> · <a href="docs/README.md">مستندات</a>
</p>

## مشاور چیست؟

**مشاور** یک پلتفرم متن‌باز عملیات آموزشی است که افراد و جریان‌های کاری پیرامون دانش‌آموز را در یک سیستم به هم متصل می‌کند.

به‌جای جدا بودن برنامه‌ریزی، ارزیابی، ارتباط، گزارش‌گیری و پیگیری در چند ابزار مختلف، مشاور این بخش‌ها را در کنار هم ارائه می‌کند:

- **پنل Admin نقش‌محور** برای تیم‌های آموزشی و مشاوران؛
- **اپ دانش‌آموز** برای برنامه، یادگیری، آزمون، گفت‌وگو، اعلان و مشاهده پیشرفت؛
- **API نسخه‌دار** با مجوزدهی و محدودسازی داده در سمت سرور؛
- قراردادهای اشتراکی و ماژول‌های قابل‌ترکیب برای توسعه بلندمدت؛
- مسیر اجرا برای وب، PWA، Tauri و Android.

خط فعال محصول **v2** است. نسخه تاریخی v1.4 روی branch `archive/v1.4` نگه‌داری می‌شود.

## چرا مشاور؟

هدف مشاور پاسخ‌دادن به سؤال‌های واقعی تیم آموزشی در یک جریان کاری متصل است:

> امروز کدام دانش‌آموز نیاز به توجه دارد؟ روی چه برنامه‌ای کار می‌کند؟ آیا عقب افتاده؟ بعد از ارزیابی چه تغییری کرده؟ چه کسی پیگیری کرده و قدم بعدی چیست؟

### قابلیت‌های اصلی

| حوزه | قابلیت‌ها |
| --- | --- |
| عملیات دانش‌آموز | پرونده، ارتباط با والد/سرپرست، onboarding، پیگیری و دسترسی محدودشده |
| برنامه‌ریزی | برنامه مطالعه، task، study session، پیشرفت و follow-up |
| ارزیابی | آزمون، آزمونک، سؤال، مرور اشتباهات، پیشنهاد و تحلیل |
| ارتباط | Chat، قابلیت‌های realtime، اعلان و جریان‌های ارتباطی Admin |
| یادگیری | درس‌ها، منابع آموزشی و فرایندهای یادگیری |
| گزارش | Dashboard، گزارش، فعالیت و analytics |
| عملیات | Needs attention، ابزارهای سیستمی، retry/recovery و import/export |
| اجرا | Admin وب، Student وب/PWA، Tauri و مسیر Android |

برای مشاهده مسیرهای اصلی محصول، [SHOWCASE.md](SHOWCASE.md) را ببینید.

## جریان متصل دانش‌آموز

یک مسیر معمول در مشاور:

1. باز کردن **Needs attention** و دیدن موارد مهم.
2. انتخاب دانش‌آموز و مشاهده زمینه فعال او.
3. رفتن به **Planner** و بررسی یا تنظیم برنامه.
4. مشاهده **Reports** برای درک پیشرفت.
5. ادامه ارتباط در **Chat**.
6. بررسی **Assessments** و موارد نیازمند پیگیری.
7. اجرای اقدام‌ها مطابق نقش، capability و scope سمت سرور.

صفحه‌ها و عملیات دقیق هر کاربر بر اساس نقش، دسترسی، سازمان و محدوده دانش‌آموز تعیین می‌شود.

## اجزای اصلی

| پروژه | مسئولیت | فناوری | پورت محلی |
| --- | --- | --- | ---: |
| [`apps/admin/`](apps/admin/) | عملیات آموزشی نقش‌محور | React 18 + Vite | `8081` |
| [`apps/student/`](apps/student/) | تجربه وب/PWA/native دانش‌آموز | React 18 + Vite + Tauri | `8080` |
| [`apps/api/`](apps/api/) | API نسخه‌دار و composition root | NestJS 11 + Fastify + TypeORM | `4000` |
| [`student-core/`](student-core/) | دامنه و قرارداد مستقل از runtime | TypeScript | — |
| [`packages/api-contract/`](packages/api-contract/) | قراردادهای اشتراکی API | TypeScript | — |
| [`packages/cmb/`](packages/cmb/) | قابلیت‌های قابل‌ترکیب بک‌اند | TypeScript | — |

## معماری

مشاور یک **grouped product monorepo** با **modular-monolith backend** است.

```text
Admin ───────┐
             ├── /api/v2 ──> NestJS + Fastify API ──> TypeORM / SQLite
Student ─────┘
  │
  └── student-core

api-contract ──> Admin / student-core
CMB packages ──> API
```

برای جزئیات بیشتر:

- [معماری مخزن](ARCHITECTURE.md)
- [نقشه سیستم](docs/architecture/system-map.md)
- [مرزهای وابستگی](docs/architecture/dependency-boundaries.md)
- [طراحی Backend v2](docs/architecture/backend-v2-design.md)
- [Student/Tauri runtime](docs/architecture/student-v2-tauri-runtime.md)

## شروع سریع

### اجرای کامل با Docker

نیازمندی‌ها: **Git** و **Docker Compose**.

```bash
git clone https://github.com/Mobin-Karam/moshaver.git
cd moshaver
docker compose up --build
```

| سرویس | آدرس |
| --- | --- |
| Student | `http://localhost:8080` |
| Admin | `http://localhost:8081` |
| API health | `http://localhost:4000/health` |
| Swagger | `http://localhost:4000/api/v2/docs` |

توقف:

```bash
docker compose down
```

از `--volumes` فقط زمانی استفاده کنید که حذف داده محلی عمدی است.

### توسعه محلی

ابزارهای سطح مخزن به Node.js `>=22.13.0 <23` نیاز دارند.

```bash
npm run bootstrap
npm run workspace:check
```

Backend:

```bash
cp apps/api/.env.example apps/api/.env
npm --prefix apps/api run migration:run
npm --prefix apps/api run seed
npm --prefix apps/api run dev
```

Frontend:

```bash
npm --prefix apps/admin run dev
# یا
npm --prefix apps/student run dev
```

فایل‌های `.env`، token، کلید خصوصی، داده production یا credential را commit نکنید.

## کیفیت و امنیت

```bash
npm run workspace:check
npm run architecture:check
npm run contracts:check
npm run verify
npm run docs:check
```

امنیت فقط در UI اعمال نمی‌شود. authorization، scope سازمان/دانش‌آموز، validation، CORS، Helmet، جریان احراز هویت، CSRF و migration در سمت سرور حفظ می‌شوند.

آسیب‌پذیری مشکوک را در issue عمومی منتشر نکنید؛ [SECURITY.md](SECURITY.md) را دنبال کنید.

## مستندات

| نیاز | شروع از |
| --- | --- |
| دیدن محصول | [SHOWCASE.md](SHOWCASE.md) |
| فهم معماری | [ARCHITECTURE.md](ARCHITECTURE.md) |
| همه مستندات | [docs/README.md](docs/README.md) |
| اجرا و validation | [Repository runbook](docs/operations/repository-runbook.md) |
| توسعه امن | [Developer handbook](docs/operations/developer-handbook.md) |
| پوشش Admin | [Admin capability matrix](docs/ADMIN_V2_CAPABILITY_MATRIX.md) |
| مسیر محصول | [Version roadmap](docs/product/version-roadmap.md) |

## مشارکت

برای مشارکت، [CONTRIBUTING.md](CONTRIBUTING.md) را بخوانید.

## مجوز

مشاور تحت **MIT License** منتشر شده است. متن مجوز در [LICENSE](LICENSE) قرار دارد.

---

<p align="center">
  <strong>مشاور v2</strong><br />
  یک فضای کاری متصل برای برنامه‌ریزی، یادگیری، ارتباط، ارزیابی و پیگیری دانش‌آموز.
</p>
