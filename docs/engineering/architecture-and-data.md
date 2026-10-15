# Architecture and data integrity

Moshaver uses a modular monolith: one NestJS API composition root, product-owned modules, reusable CMB platform packages, and public contracts. The dependency direction and allowed imports are defined in [dependency boundaries](../architecture/dependency-boundaries.md); the [backend module inventory](../architecture/inventory/backend-v2-module-inventory.md) helps locate owners. Add a service only for a documented operational need, such as an independent scaling or availability requirement.

## Ownership rules

For a feature, name its owning module, API contract, persistence schema and frontend consumer before editing. Controllers handle HTTP and DTO validation; services own decisions and authorization; migrations own durable schema changes. Cross-module behavior uses public entrypoints and explicit use cases. A product module must not write another module's private tables directly. CMB packages must not import education-specific code. The [architecture checks](../../tooling/architecture/check-boundaries.mjs) enforce parts of these boundaries, while source review remains necessary.

`packages/api-contract` is the shared consumer contract for `/api/v2`. Preserve existing clients unless a breaking change is reviewed. Before changing a response, error, or route, inspect Admin, student-facing Admin, and other consumers; update the contract and test both allowed and denied behavior. The [HTTP API guide](../components/backend-v2-http-api.md) and [developer handbook](../operations/developer-handbook.md) describe the transport conventions. Server-side capability checks, tenant scope, input validation, session authentication and CSRF are required even when the UI hides an action.

## SQLite integrity and migrations

The current API [data source](../../apps/api/src/database/data-source.ts) uses `better-sqlite3`, TypeORM migrations, `synchronize: false`, WAL mode, foreign keys and a busy timeout. The production topology keeps one API replica with SQLite. Do not assume a uniqueness rule exists because a document recommends it: inspect the entity, migration and database constraint before relying on it.

For attendance or another concurrent write path, define the exact business key first. If duplicate committed rows are forbidden, enforce that invariant with a database constraint or an atomic operation, then test simultaneous requests and migration compatibility. A suggested `UNIQUE(student_id, session_id)` is only an example; the actual key may include organization, class, date, period or status. Check the current attendance migrations and [attendance implementation notes](../change-notes/README.md) before changing it.

A schema change needs a versioned migration, a fresh-database run, an upgrade test against representative existing data, and a recovery plan. Prefer additive changes, data backfill, consumer migration, then removal. Short transactions and explicit conflict handling matter for SQLite write contention. A code rollback does not undo a migration. The [database integrity rollout](../operations/database-multi-role-integrity-rollout.md) and [release evidence guide](../operations/release-evidence.md) cover rehearsal and backup boundaries.

## API, frontend and security review

- Bound collection endpoints with pagination or explicit limits; profile large student, attendance and schedule queries before adding indexes or caching.
- Keep query keys and invalidation consistent in Admin; use existing feature APIs and shared UI. Handle loading, empty, failure, disabled, keyboard, responsive, theme and Persian/RTL states.
- Authorize by capability and resource scope on the API. Admin reads `/me/context` for role and organization state, but client visibility is not authorization.
- Validate imports and uploads with allowlisted DTOs, size limits, scoped preview/commit/export and audit history. The [repository guide](../../AGENTS.md) defines the transfer boundary.
- For a bug, add a regression test when practical and verify the original trigger; for a new feature, prove success, validation failure, permission denial and scope isolation.
