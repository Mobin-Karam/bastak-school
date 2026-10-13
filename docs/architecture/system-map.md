# Moshaver v2 system map

This map describes the active checkout as verified on 2026-10-12. The runnable UI is `apps/admin`, including student-facing views. The standalone `apps/student` source and its historical PWA/Tauri composition root are absent. `student-core` remains a runtime-neutral package, and product-specific operations are composed in `apps/api`.

## Runtime relationships

```text
Admin browser, including student accounts :8081
              │ same-origin /api/v2 proxy
              ▼
NestJS/Fastify API :4000 ──► TypeORM ──► SQLite
              │
              └── CMB public platform packages and API contracts
```

Production uses the [LAN two-service Compose topology](../operations/ci-cd-pipeline.md): API plus Admin/proxy. The root development `docker-compose.yml` still names a removed Student app and should not be treated as a working current topology until updated. The release container check uses the production Compose files and disposable TLS/database configuration.

## Source ownership

| Path | Ownership |
| --- | --- |
| `apps/api/` | `/api/v2` composition root, product modules, TypeORM entities/migrations, auth and capabilities |
| `apps/admin/` | React/Vite Admin and student-facing views, organized by feature |
| `student-core/` | Runtime-neutral student types and provider contracts |
| `packages/api-contract/` | Shared public API contract |
| `packages/cmb/` | Reusable platform and kernel packages |
| `docs/` | Current guidance, plans and clearly dated historical evidence |

The [workspace graph](../../tooling/workspace/projects.json) is the executable project DAG. The [dependency boundaries](./dependency-boundaries.md) define allowed imports.

## Security and data boundaries

Authentication is session-based; mutating requests require CSRF protection. API capability and organization/student scope checks are authoritative. Admin uses `/me/context` to render the active capability state, but hiding a control does not authorize its API. SQLite migrations and seeds must target disposable data unless an explicitly reviewed production procedure applies. See [architecture and data integrity](../engineering/architecture-and-data.md) and the [repository runbook](../operations/repository-runbook.md).

The v1.4 source is preserved on `archive/v1.4`; migration and history documents describe past states, not active runtime contracts.
