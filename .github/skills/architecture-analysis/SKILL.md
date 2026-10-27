---
name: architecture-analysis
description: Analyze software architecture, boundaries, dependencies, data flow, contracts, runtime topology, reliability, scalability, and maintainability.
---

# Architecture Analysis Skill

Use Graphify first when available, then source verification. Apply applications → product/domain → CMB platform → CMB kernel/contracts; CMB must not depend on Moshaver education domains.

## Checklist
- entry points and runtime processes
- module/package/service boundaries
- dependency direction and cycles
- synchronous/asynchronous flows
- persistence and external services
- public/internal contracts
- auth and trust boundaries
- deployment/runtime topology
- failure handling, retries, idempotency
- observability and operability
- test architecture

Prioritize concrete problems over stylistic preferences. Tie every finding to evidence and real impact.

## Release topology

When operations are relevant, map the documented path in `docs/operations/ci-cd-pipeline.md`: protected PR, develop qualification, reviewed main promotion, exact artifact, private receiver, isolated migration rehearsal, and production evidence. Identify actual breaks in provenance, trust boundaries, configuration ownership, database compatibility, rollback assumptions, and observability; do not claim private/host activation without evidence.
