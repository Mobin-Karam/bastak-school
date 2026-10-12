# Engineering roadmap

This roadmap adapts the supplied platform planning note to the current repository. “Implemented” means a source-backed mechanism exists; it does not certify production readiness. “Next” items need an issue, owner and acceptance evidence before being treated as commitments.

| Area | Current source-backed foundation | Next evidence or improvement |
| --- | --- | --- |
| Architecture | Grouped monorepo, modular-monolith API, CMB boundaries and architecture checks | Keep module ownership maps and test cross-module flows as features evolve |
| Database | SQLite with migrations, WAL, foreign keys, busy timeout; deployment backup before replacement | Rehearse populated upgrades and restore, check attendance uniqueness/concurrency under load |
| Testing | Package suites, disposable API journeys, accessibility, layout browser checks, container smoke | Broaden seeded account browser journeys and critical attendance/class-change workflows |
| CI/CD | Protected PR gate, develop-to-main release PR and verified-main dispatch | Measure pipeline duration and rehearse recovery in a disposable deployment |
| API design | `/api/v2` and shared contract checks | Maintain deprecation records for incompatible changes and consumer migrations |
| Security | Sessions, CSRF, capabilities, scoped API tests and audit boundaries | Review each new action for tenant scope, denied access and audit evidence |
| Observability | Health/readiness checks and operational logs | Establish request/error/latency metrics, alert ownership and retention |
| Performance | Existing query and UI patterns | Benchmark attendance, directories and dashboards; add indexes or caching only from evidence |
| Frontend | Feature-oriented Admin and shared student views | Strengthen real browser coverage for mobile, RTL and context switching |
| Data integrity | Migration and integrity tests | Define and test business-key constraints and concurrent writes for each critical record |
| Documentation | Architecture, runbooks, release evidence, engineering guide | Keep source-linked ownership, current-state and historical evidence separate |
| Scalability | Single-server deployment with one SQLite API replica | Evaluate workers, PostgreSQL or redundancy when measured demand requires them |

Suggested sequence:

1. **Stability:** keep required CI checks, migration rehearsals, disposable backup restore, and regression tests current.
2. **Maintainability:** record module/API ownership and compatibility changes; enforce capability and scope contracts.
3. **Performance:** establish workload baselines, then tune queries, pagination and indexes with before/after evidence.
4. **Growth:** evaluate database, queue and deployment changes from workload and availability requirements.

Before merging a feature, ask who owns it, which consumers and records can break, which permissions and scopes apply, what tests prove the behavior, how it is deployed or recovered, and which signal will reveal a failure. Put findings in the PR and the relevant [release evidence](../operations/release-evidence.md) or [architecture decision](../architecture/adr/0002-modular-monolith-cmb.md), rather than treating this roadmap as proof that a feature is complete.
