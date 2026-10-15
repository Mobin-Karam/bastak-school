# Moshaver documentation

This is the navigation hub for the active repository. Choose a goal below rather than browsing by filename. Current guidance lives in architecture, engineering, components and operations; time-bound reports live in evidence, transitions or archive.

## Find the right document

| If you need to… | Start here | Status |
| --- | --- | --- |
| Understand module and project ownership | [Architecture](./architecture/repository-architecture.md), [system map](./architecture/system-map.md), [dependency boundaries](./architecture/dependency-boundaries.md) | Current policy; verify paths in source |
| Build a feature safely | [Engineering guide](./engineering/README.md), [developer handbook](./operations/developer-handbook.md) | Current guidance |
| Understand tests and release gates | [Testing strategy](./engineering/testing-strategy.md), [CI/CD pipeline](./operations/ci-cd-pipeline.md) | Current source-backed pipeline |
| Run, deploy or recover | [Operations index](./operations/README.md), [GitHub CI/CD operations](./operations/github-cicd.md) | Current runbooks |
| Find an application or API contract | [Components index](./components/README.md), [Admin capability matrix](./reference/admin-capability-matrix.md) | Current only after source verification |
| Explore product direction | [Product index](./product/README.md), [Open Platform](./platform/README.md) | Mix of current and proposed work |
| Inspect a delivered feature | [Feature guides](./features/README.md), [change notes](./change-notes/README.md) | Check implementation date |
| Review gaps or a planned transition | [Transition index](./transitions/README.md) | Plans and compatibility evidence |
| Investigate a prior observation | [Evidence](./evidence/README.md), [archive](./archive/README.md) | Snapshot evidence |
| Prepare user-visible release notes | [Releases](./releases/README.md) | Release history |

## Engineering priorities

The [architecture and data guide](./engineering/architecture-and-data.md) covers modular ownership, API contracts, SQLite migrations, concurrency, security and frontend review. The [testing guide](./engineering/testing-strategy.md) maps unit, integration, journey, accessibility, browser and deployment checks. [Performance and observability](./engineering/performance-and-observability.md) defines how to establish baselines before tuning. The [roadmap](./engineering/roadmap.md) distinguishes mechanisms already in source from proposed work. Together these pages adapt the supplied platform planning note to this repository without treating suggested targets as measured results.

## Documentation structure

```text
docs/
├── architecture/     System model, boundaries, inventories and ADRs
├── engineering/      Cross-cutting design, testing, performance and roadmap
├── components/       Application and HTTP API reference
├── features/         Feature-owned guides
├── change-notes/     Notes for delivered changes
├── operations/       Local runbooks, CI/CD, deployment and recovery
├── product/          UX direction and product plans
├── platform/         Reusable CMB platform guide
├── transitions/      Compatibility work and staged plans
├── evidence/         Dated audit evidence
├── reference/        Read-only matrices, plans and data fixtures
├── archive/          Older snapshots, fixes and v1 records
└── releases/         Changelog and release assets
```

The [reference index](./reference/README.md) holds capability matrices, migration comparisons, planning documents and fixtures that are useful but are not the primary operating documentation. Confirm their date and current source before using them as instructions. The [API migration manifest](./api-migration-manifest.json) is machine-readable evidence. The [CMB documentation site](./cmb-site/index.html) is a separate presentation surface, not the canonical operations runbook.

## Maintenance contract

Current behavior belongs in architecture, engineering, components or operations. Transition work and product proposals must say what is planned. Evidence and archive retain the record of their date. Update an owning document and its inbound index when behavior changes; do not copy the same runbook into several locations. Use the [documentation maintenance guide](./operations/documentation-maintenance.md) and run `npm run docs:check` plus `git diff --check -- docs` before review. Never include credentials, production data or private environment values.
