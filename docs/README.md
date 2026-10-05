# Moshaver Open Platform documentation

This directory is the navigation hub for the active Moshaver v2 monorepo. Documentation is grouped by intent so contributors can distinguish current architecture, product behavior, operations, migration plans, and historical evidence.

Last repository documentation refresh: **2026-10-02**.

## Start here

- **New to the product?** Read the [Product Showcase](../SHOWCASE.md).
- **Building another operations product?** Start with the [Open Platform guide](./platform/README.md).
- **New to the repository?** Read [Repository architecture](./architecture/repository-architecture.md).
- **Running it locally?** Use the [Repository runbook](./operations/repository-runbook.md).
- **Changing code?** Use the [Developer handbook](./operations/developer-handbook.md).
- **Looking for API behavior?** Read [Backend v2 HTTP API](./components/backend-v2-http-api.md).
- **Reviewing Admin coverage?** Use the [Admin v2 capability matrix](./ADMIN_V2_CAPABILITY_MATRIX.md).

The complete historical v1.4 tree is preserved on `archive/v1.4`.

## Documentation map

```text
docs/
├── architecture/  Current system shape, boundaries, inventories and ADRs
├── components/    Runnable apps and public API documentation
├── operations/    Run, validate, secure, recover and deploy the system
├── migrations/    Compatibility gaps and staged v1-to-v2 work
├── product/       Product direction, UX principles and shared assets
├── platform/      Public platform adoption guide and capability roadmap
├── releases/      Changelog, release notes and evidence
└── history/       Dated audits, fixes and evidence snapshots
```

Current behavior belongs in `architecture/`, `components/`, or `operations/`. Unfinished migration work belongs in `migrations/`. Time-bound evidence belongs in `history/` and should not be treated as current behavior without checking source and tests.

## Architecture

- [Repository architecture](./architecture/repository-architecture.md)
- [Workspace foundation](./architecture/workspace-foundation.md)
- [Phase-1 architecture inventory](./architecture/inventory/README.md)
- [Backend v2 module inventory](./architecture/inventory/backend-v2-module-inventory.md)
- [Backend v2 dependency map](./architecture/inventory/backend-v2-dependency-map.md)
- [Current project/package consumers](./architecture/inventory/project-consumers.md)
- [Target monorepo layout](./architecture/target-monorepo-layout.md)
- [Dependency boundaries](./architecture/dependency-boundaries.md)
- [CMB reference and release policy](./architecture/cmb-reference-and-release.md)
- [Repository architecture migration](./architecture/repository-architecture-migration.md)
- [ADR 0001 — grouped product monorepo](./architecture/adr/0001-grouped-product-monorepo.md)
- [ADR 0002 — modular monolith with CMB](./architecture/adr/0002-modular-monolith-cmb.md)
- [System map](./architecture/system-map.md)
- [Backend v2 design](./architecture/backend-v2-design.md)
- [Student core boundary](./architecture/student-core-boundary.md)
- [Student v2 and Tauri runtime](./architecture/student-v2-tauri-runtime.md)
- [AI repository operating system](./architecture/ai-repository-operating-system.md)
- [Graphify](./architecture/graphify.md)

## Open Platform

- [Moshaver Open Platform](./platform/README.md)
- [Platform roadmap](./platform/ROADMAP.md)

## Components and APIs

- [Backend v2 service](./components/backend-v2-service.md)
- [Backend v2 HTTP API](./components/backend-v2-http-api.md)
- [Admin v2 application](./components/admin-v2-application.md)
- [Student v2 application](./components/student-v2-application.md)
- [Admin v2 Communication workspace](./components/admin-v2-communication-workspace.md)
- [Admin v2 capability matrix](./ADMIN_V2_CAPABILITY_MATRIX.md)
- [Student and Family exam experience audit](./migrations/STUDENT_FAMILY_EXAM_AUDIT.md)

## Operations

- [Repository runbook](./operations/repository-runbook.md)
- [Release evidence checklist](./operations/release-evidence.md)
- [Developer handbook](./operations/developer-handbook.md)
- [Feature and bug playbook](./operations/feature-and-bug-playbook.md)
- [Maintenance guide](./operations/maintenance-guide.md)
- [Documentation maintenance](./operations/documentation-maintenance.md)
- [Plan import schema version 2](./operations/plan-import-schema-v2.md)
- [Admin v2 Web Push verification](./operations/admin-v2-web-push-verification.md)
- [Backend v2 product demo seed](./operations/backend-v2-product-demo-seed.md)
- [Moshaver v2 PaaS deployment](./operations/paas-deployment.md)

## Migration work

- [Backend v1-to-v2 strategy](./migrations/backend-v1-to-v2-strategy.md)
- [Backend v2 discovery](./migrations/backend-v2-discovery.md)
- [Admin v2 API gap plan](./migrations/admin-v2-api-gap-plan.md)
- [Admin v2 API compatibility](./migrations/admin-v2-api-compatibility.md)
- [Admin v2 migration guide](./migrations/admin-v2-migration-guide.md)
- [Historical API v1/v2 comparison](./API_V1_V2_AUDIT.md)
- [Student v1 feature inventory](./migrations/student-v1-feature-inventory.md)
- [Student v1-to-v2 audit](./migrations/student-v1-to-v2-audit.md)
- [Student v2 parity gaps](./migrations/student-v2-parity-gaps.md)
- [Student v2 delivery plan](./migrations/student-v2-delivery-plan.md)

## Product and releases

- [Product showcase](../SHOWCASE.md)
- [Interface design principles](./product/interface-design-principles.md)
- [Education planning improvement](./product/education-planning-improvement.md)
- [Education Platform control-surface audit](./product/education-platform-control-audit.md)
- [Education workspace audit](./product/education-workspace-audit.md)
- [Version roadmap](./product/version-roadmap.md)
- [Application icon catalog](./product/application-icon-catalog.md)
- [Product changelog](./releases/product-changelog.md)

## Historical evidence

- [v1.4 architecture audit — 2026-08-24](./history/audits/v1-4-architecture-audit-2026-08-24.md)
- [Repository inventory — 2026-08-24](./history/audits/repository-inventory-2026-08-24.md)
- [Initial v2 analysis](./history/audits/v2-initial-analysis.md)
- [Backend v2 test snapshot](./history/audits/backend-v2-test-report.md)
- [Admin v2 test snapshot](./history/audits/admin-v2-test-report.md)
- [Auth/sync fix v1.3.3](./history/fixes/auth-sync-v1-3-3.md)
- [Backend v1 changelog](./history/backend-v1-changelog.md)
- [Platform audit — 2026-09-28](./history/audits/platform-audit-2026-09-28.md)

## Maintenance rules

- Use descriptive kebab-case filenames that include the component/version when version-specific.
- Put verification dates inside snapshot documents and move stale snapshots to `history/`.
- Update this index and inbound links when moving a document.
- Keep one canonical operations guide and link to it rather than duplicating instructions.
- Never place credentials, tokens, production database contents, or private `.env` values in documentation.
