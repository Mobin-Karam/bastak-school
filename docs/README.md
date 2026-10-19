# Moshaver documentation

This is the maintained starting point for Moshaver/Bastak School. Start with a current repository document, verify its claims in source and tests, then use official external documentation only for the underlying technology. Dated audits, old plans, and retired application references live in the [archive](./archive/README.md); they explain history, not today's contract.

## Start here

| Your goal | Read first | Then verify |
| --- | --- | --- |
| Understand ownership, boundaries, and dependencies | [Repository architecture](./architecture/repository-architecture.md), [system map](./architecture/system-map.md), [dependency boundaries](./architecture/dependency-boundaries.md) | `tooling/workspace/projects.json`, imports, and affected tests |
| Build or repair a feature | [Developer handbook](./operations/developer-handbook.md), [feature and bug playbook](./operations/feature-and-bug-playbook.md) | Route → UI → API client → controller/guard → service → migration → tests |
| Change Admin UI or a student-facing flow | [Admin application guide](./components/admin-v2-application.md), [testing strategy](./engineering/testing-strategy.md) | Capability gate, RTL/LTR, responsive, keyboard, loading/error, and browser behavior |
| Change an API, authorization rule, or database schema | [HTTP API reference](./components/backend-v2-http-api.md), [architecture and data](./engineering/architecture-and-data.md), [permission matrix](./security/permission-matrix.md) | Consumers, `/api/v2` compatibility, scoped authorization, migration/recovery tests |
| Run tests, prepare a PR, or investigate CI | [Repository runbook](./operations/repository-runbook.md), [CI/CD pipeline](./operations/ci-cd-pipeline.md) | The exact package script and the required `CI Gate` result |
| Deploy, recover, or change infrastructure | [Development-to-production guide](./operations/development-to-production.md), [GitHub CI/CD operations](./operations/github-cicd.md), [immutable LAN runbook](./operations/immutable-lan-runbook.md) | Private receiver result, trusted HTTPS readiness, release receipt, backup, authorized smoke |
| Learn a delivered feature | [Feature guides](./features/README.md), [change notes](./change-notes/README.md) | Current route, API contract, tests, and migration history |
| Review product direction or compatibility history | [Product index](./product/README.md), [archived transitions](./archive/transitions/README.md) | Mark plans and snapshots as historical until source proves otherwise |

## Topics, tags, and official learning

The project documents are the authority for repository conventions. These external links are official technology references for understanding the tools behind those conventions; they never override a local contract or security boundary.

| Tags | Repository guide | Official learning | Use it for |
| --- | --- | --- | --- |
| `typescript` `react` `vite` `rtl` `a11y` | [Admin guide](./components/admin-v2-application.md) | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/), [React Learn](https://react.dev/learn), [Vite Guide](https://vite.dev/guide/), [MDN accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) | Types, component state, build behavior, semantic HTML, keyboard and assistive-technology support |
| `api` `nestjs` `fastify` `authorization` | [HTTP API](./components/backend-v2-http-api.md), [permission matrix](./security/permission-matrix.md) | [NestJS docs](https://docs.nestjs.com/), [Fastify reference](https://fastify.dev/docs/latest/Reference/), [OWASP ASVS](https://owasp.org/projects/asvs) | Controllers, request lifecycle, validation, authentication, authorization, and threat-aware review |
| `sqlite` `typeorm` `migration` `recovery` | [Architecture and data](./engineering/architecture-and-data.md), [database migration plan](./architecture/database-migration-plan.md) | [TypeORM migrations](https://typeorm.io/docs/migrations/setup/) | Forward-safe schema changes, migration configuration, and why automatic schema synchronization is not a release strategy |
| `test` `vitest` `playwright` `quality` | [Testing strategy](./engineering/testing-strategy.md), [repository runbook](./operations/repository-runbook.md) | [Vitest guide](https://vitest.dev/guide/), [Playwright writing tests](https://playwright.dev/docs/writing-tests) | Focused unit tests, accessibility checks, reliable browser tests, and evidence boundaries |
| `docker` `compose` `ci` `github-actions` `release` | [CI/CD pipeline](./operations/ci-cd-pipeline.md), [development-to-production](./operations/development-to-production.md) | [Docker Compose in production](https://docs.docker.com/compose/how-tos/production/), [GitHub Actions workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax) | Compose overlays, image identity, workflow triggers, environments, and release troubleshooting |

## Learn or investigate with ChatGPT

Use [ChatGPT](https://chatgpt.com/) to learn a topic, explain a failure, or turn a repository document into a checklist. Attach or paste only the relevant non-secret file, command output, or screenshot. Never provide production environment files, access tokens, private keys, cookies, student data, or a database backup.

Good prompts state the goal, repository context, evidence, constraints, and desired output. This follows OpenAI's [prompting guidance](https://learn.chatgpt.com/docs/prompting?site_variant=chatgpt) and makes answers easier to verify.

| Topic | Copy this prompt into ChatGPT |
| --- | --- |
| Feature implementation | `I am changing a Bastak School feature. Read this route, UI component, API client, controller, service, and tests. Trace the flow, list authorization and tenant-scope boundaries, then propose the smallest complete change and focused regression tests. Do not invent APIs or weaken server authorization.` |
| React/Admin UI | `Teach me this React and TypeScript component from the repository. Explain its data flow, state, accessibility, RTL/responsive concerns, and likely regression tests. Ask me one short question at a time, then give me a small exercise using this exact component.` |
| API or migration | `Review this NestJS/TypeORM change for API compatibility, validation, authorization, tenant isolation, migration safety, and rollback/recovery impact. Separate confirmed problems from assumptions. Provide a test plan; do not recommend synchronize, destructive resets, or production seed commands.` |
| CI or deployment failure | `Diagnose this Bastak School CI/deployment failure from the exact failed log and workflow/script. Identify the earliest root cause, the smallest safe fix, the command to reproduce it on disposable resources, and the evidence still needed before production. Do not suggest bypassing CI, rebuilding unverified production images, or deleting data.` |
| Security review | `Review this change as a multi-tenant school application. Check authentication, capability authorization, organization/student scope, input validation, CSRF/session behavior, data exposure, and audit implications. Mark each finding as confirmed or hardening-only and propose regression tests.` |

For evidence-heavy questions, ask ChatGPT to cite official sources and clearly label assumptions. Review every suggested change against this repository's source, tests, and current runbooks before applying it.

## Documentation map

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
├── reference/        Read-only matrices, plans and data fixtures
├── archive/          Dated evidence, transitions, snapshots, fixes and v1 records
└── releases/         Changelog and release assets
```

The [reference index](./reference/README.md) holds capability matrices, migration comparisons, planning documents, and fixtures that are useful but are not the primary operating documentation. The [API migration manifest](./api-migration-manifest.json) is machine-readable evidence. The [CMB documentation site](./cmb-site/index.html) is a presentation surface, not the canonical operations runbook.

## Keep documentation current

Current behavior belongs in architecture, engineering, components, features, or operations. Update the owning document and its inbound index when behavior changes; do not copy the same runbook into several locations. Use the [documentation maintenance guide](./operations/documentation-maintenance.md), then run:

```bash
npm run docs:check
git diff --check -- docs
```

Never include credentials, production data, or private environment values in documentation or AI prompts.
