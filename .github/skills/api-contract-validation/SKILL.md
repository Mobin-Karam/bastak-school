---
name: api-contract-validation
description: Trace and validate API contracts across producers, consumers, schemas, errors, authentication, pagination, and versioning.
---

# Api Contract Validation Skill

In Moshaver, trace `apps/api`, `packages/api-contract`, and actual Admin consumers. Preserve `/api/v2`; capability and organization scope are part of the contract.

## Contract checklist
- method/transport and route/topic
- authentication/authorization
- path/query/header/body schema
- response schema and status codes
- error envelope
- pagination/filter/sort semantics
- idempotency/retry behavior
- realtime/event payloads when applicable
- generated clients/types/docs
- frontend/mobile/external consumers

Before changing a shared contract, find all known consumers. Prefer additive/backward-compatible changes unless breaking behavior is explicitly intended.

## Release compatibility

When a contract change ships with a migration or rolling release, follow `docs/operations/development-to-production.md`: verify old/new application and defaulted legacy-row compatibility, preserve `/api/v2`, and include upgrade/recovery rehearsal where persistence is affected. A source test or deployment dispatch does not prove the deployed proxy/cookie/client path; record that evidence separately.
