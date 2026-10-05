# Moshaver Open Platform roadmap

This is a direction and contribution map, not a promise of release dates.
Every item must preserve the dependency direction described in
[the architecture](../architecture/repository-architecture.md).

## Available now

| Capability | Evidence | Use it for |
| --- | --- | --- |
| Modular runtime | `@moshaver/cmb-kernel`, `@moshaver/cmb-starter` | dependency-aware module composition |
| Security foundation | CMB auth, authorization, identity, tenancy | sessions, CSRF, capability and work-context evaluation |
| Operational primitives | health, persistence, infrastructure, system | readiness, migrations, adapters, audit projection |
| Communication primitives | notifications, realtime, activity | authorized events and durable notification state |
| Data transfer | CMB data-transfer | safe import normalization and transfer boundaries |
| Product proof | Moshaver Education | planning, assessments, chat, reports, student operations |

## Next platform capabilities

### P1 — reusable operational extensions

- **Custom-field definitions:** typed field metadata and validation adapters;
  product entities retain ownership of stored values and resource policy.
- **Saved views:** server-authorized view definitions for filters, columns,
  sorting, and user/organization ownership; no arbitrary client queries.
- **Attachments:** an object-storage port, metadata, size/type validation,
  authorization, retention, and malware-scanning integration point.
- **Scheduled jobs:** idempotent queue-port contracts, retry policy, execution
  audit, and a no-op local adapter.

### P2 — automation and integrations

- **Workflow engine:** declarative triggers and vetted actions, evaluated by
  server-side capabilities and resource policies; no arbitrary code execution.
- **Integration framework:** OAuth/provider adapters, encrypted secret
  references outside descriptors, webhooks, rate limits, and synchronization
  jobs.
- **Calendar and messaging adapters:** only after tenant isolation, consent,
  retention, and failure/retry behavior are specified and tested.

### P3 — ecosystem maturity

- Stable public package versioning and npm publication after release gates.
- Extension manifests, compatibility policy, and a sandboxed execution model.
- Templates for education, service operations, and other domain products.
- Optional hosted deployment guidance that never weakens the self-hosted path.

## Non-negotiable boundaries

- No CMB package may depend on Moshaver Education or an application adapter.
- No extension may bypass authentication, CSRF, tenant scope, capability checks,
  validation, audit, or data-retention policy.
- Workflow actions must be allowlisted, typed, and idempotent; arbitrary shell,
  SQL, or unrestricted network execution is out of scope.
- A platform primitive is accepted only with public entrypoints, tests,
  documentation, migration/rollback evidence where persistent, and a clear
  first consumer.

## Decision gates

Before starting a roadmap item, write a short proposal that defines:

1. user problem and first product consumer;
2. domain ownership versus reusable mechanism;
3. authorization and tenant policy;
4. public contract and compatibility plan;
5. persistence, migration, retention, and rollback plan;
6. focused tests and release checks.

