# Engineering guide

This guide turns the platform engineering priorities into decisions and checks for the current Moshaver repository. It describes the code and release path as they exist, then identifies work that still needs evidence. The [documentation home](../README.md) is the entry point for the whole repository.

| Question | Read |
| --- | --- |
| How do modules, APIs and data ownership fit together? | [Architecture and data integrity](./architecture-and-data.md) |
| Which tests protect a change, and what remains manual? | [Testing strategy](./testing-strategy.md) |
| What exactly runs from a PR through production? | [CI/CD pipeline](../operations/ci-cd-pipeline.md) and [GitHub operations](../operations/github-cicd.md) |
| How should we measure speed and reliability? | [Performance and observability](./performance-and-observability.md) |
| Which improvements are implemented or proposed? | [Engineering roadmap](./roadmap.md) |

The accepted architecture is a grouped monorepo with a modular-monolith API. `apps/api` and `apps/admin` are the active applications; student views currently run in Admin. `student-core` remains a runtime-neutral package. See the [repository architecture](../architecture/repository-architecture.md) and [workspace graph](../../tooling/workspace/projects.json) before making cross-project changes.

These pages are guidance for implementing and reviewing work. Executable source, migrations, workflow files and tests remain authoritative. Dated audits in [`docs/audits`](../audits/README.md) and [`docs/history`](../history/README.md) record evidence from their dates, not a standing claim about production.
