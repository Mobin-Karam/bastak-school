<p align="center">
  <img src="docs/assets/bastak-school-readme-hero.svg" alt="Bastak School — role-aware school operations" width="100%" />
</p>

<h1 align="center">Bastak School</h1>

<p align="center">
  <strong>Role-aware learning and school operations for Sultan al-Olama Bastak Islamic School.</strong>
</p>

<p align="center">
  <a href="README.fa.md">فارسی</a> · <a href="SHOWCASE.md">Product showcase</a> · <a href="docs/README.md">Documentation</a>
</p>

## Product

Bastak School gives students, guardians, teachers, supervisors, and school administrators one secure workspace for learning, attendance, planning, communication, and follow-up. The same responsive web application serves Admin and Student experiences according to the signed-in account, active role, organization, and server-issued capabilities.

The API remains a versioned, server-authorized boundary at `/api/v2`. CMB remains the reusable backend platform layer; it does not receive school-domain or product-brand dependencies.

## Applications

| Project | Purpose | Local port |
| --- | --- | ---: |
| [`apps/admin/`](apps/admin/) | Bastak School Admin and Student web/PWA experience | `8081` |
| [`apps/api/`](apps/api/) | NestJS/Fastify API and composition root | `4000` |
| [`student-core/`](student-core/) | Runtime-neutral student-domain contracts | — |
| [`packages/api-contract/`](packages/api-contract/) | Shared API contract boundary | — |
| [`packages/cmb/`](packages/cmb/) | Reusable Composable Modular Backend capabilities | — |

## Quick start

Use Node.js `>=22.13.0 <23` and the leaf project lockfiles:

```bash
npm run workspace:check
npm run bootstrap

cp apps/api/.env.example apps/api/.env
npm --prefix apps/api run migration:run
npm --prefix apps/api run dev

# In another terminal
npm --prefix apps/admin run dev
```

Open `http://localhost:8081`; API readiness is at `http://localhost:4000/ready`.

For the local Compose topology:

```bash
docker compose up --build
```

The Compose project and container metadata use the Bastak School identity. Do not add `--volumes` unless deleting local persisted data is intentional.

## Architecture and security

This is a grouped product monorepo with a modular-monolith backend. Dependencies flow from application composition roots to product domains, CMB platform modules, then CMB kernel/public contracts. See [ARCHITECTURE.md](ARCHITECTURE.md) and [dependency boundaries](docs/architecture/dependency-boundaries.md).

Authorization, organization/student scoping, validation, CSRF, cookies, and audit boundaries are enforced by the API. UI visibility is never the authority boundary.

## Branding and compatibility

The editable presentation source is [`apps/admin/brand.config.json`](apps/admin/brand.config.json). It drives the Admin/Student runtime brand strings; [`npm --prefix apps/admin run brand:check`](apps/admin/package.json) prevents PWA metadata from drifting.

`@moshaver/*` package scopes, `moshaver_*` storage/cookie/cache identifiers, SQLite filenames/volumes, historical documentation, and demo-only credential labels are retained only for compatibility. They are not product-facing Bastak School branding and should not be renamed without an explicit migration plan.

## Verification

```bash
npm run workspace:check
npm run architecture:check
npm run contracts:check
npm --prefix apps/admin run typecheck
npm --prefix apps/admin run test
npm --prefix apps/admin run build
npm --prefix apps/api run build
npm run docs:check
```

See the [documentation index](docs/README.md), [development-to-production guide](docs/operations/development-to-production.md), and [Coolify deployment guide](docs/operations/coolify-deployment.md) for operational requirements. Source checks do not replace browser, device, deployment, or authorized production-flow verification.
