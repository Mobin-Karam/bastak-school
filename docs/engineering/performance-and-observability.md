# Performance and observability

Start with a measured baseline for attendance, student directories, dashboards and schedules. The current single-server SQLite deployment is an explicit capacity boundary, not evidence that a particular user count or latency is safe. Capture workload, data size, concurrency, hardware and query plan with every benchmark so the result can be repeated.

| Risk | First investigation | Candidate response after measurement |
| --- | --- | --- |
| Large student or attendance lists | Query plan, row count, response size and UI render cost | Bounded server pagination, filtering, relevant indexes, virtualization |
| Dashboard fan-out | Count queries and payload size per request | Aggregated endpoint or selective cache with explicit invalidation |
| Concurrent attendance writes | Duplicate/conflict rate, SQLite lock waits, transaction duration | Constraint/atomic write, short transaction, conflict response, capacity review |
| Repeated frontend requests | Query keys, network waterfall, invalidation | TanStack Query deduplication and suitable stale times |
| Report or upload spikes | Duration, memory, size and failure rate | Bounded batch, streaming or background work only when justified |

Useful baseline signals are request rate, p50/p95/p99 latency, error rate, CPU, memory, disk space, database query duration and SQLite busy errors. `/health` and `/ready` provide service checks, while [deployment readiness](../../.github/workflows/deployment-readiness.yml) verifies a disposable HTTPS topology. A passing readiness check does not provide long-term production monitoring. Document the current log format and alert ownership before choosing tracing, metrics or error-tracking services.

An ordinary indexed read under 300 ms p95 and a core-request error rate below 1% are **proposed starting objectives from the planning note**, not measured service levels. Define the request mix and load first, then revise targets from observed baselines. Committed attendance correctness is an invariant: no missing or duplicate records for the agreed business key. Rollback readiness requires a disposable recovery rehearsal, not just a written procedure.

Prefer changes in this order: reproduce the bottleneck, capture a baseline, inspect query plans and payloads, make the smallest change, rerun the same workload, and document the result. Consider PostgreSQL, Redis, workers or horizontal scaling only when measured concurrency, data size or availability requirements make the single-server design insufficient. The [maintenance guide](../operations/maintenance-guide.md) covers recurring checks and incident triage.
