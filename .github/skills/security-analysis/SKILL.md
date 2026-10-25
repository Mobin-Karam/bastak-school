---
name: security-analysis
description: Audit relevant application security surfaces and produce prioritized, evidence-based remediation guidance.
---

# Security Analysis Skill

For Moshaver, verify API capability checks, organization isolation, `/me/context` switching behavior, CSRF/session boundaries, and least-privilege CI/deployment permissions.

## Inspect when applicable
- authentication/session/token lifecycle
- authorization, roles, ownership, tenant/workspace isolation
- input validation and output encoding
- SQL/command/template/header injection
- XSS, CSRF, SSRF, open redirects
- file upload/path traversal
- secrets and sensitive logs
- cryptographic usage
- CORS/security headers
- dependency/supply-chain configuration
- CI/cloud permissions

Report realistic exploit path, impact, evidence, and remediation. Do not report theoretical categories that the code does not expose.

## Deployment trust boundary

For deployment surfaces, audit `docs/operations/immutable-lan-runbook.md`: protected environments, exact SHA/run/artifact verification, private runner isolation, least-privilege separate tokens, host-owned secrets/TLS, immutable images, and safe backup/recovery. A source dispatch is not trusted deployment proof. Flag privileged PR execution, mutable tags/host rebuilds, secrets in source/logs, and any bypass of migration rehearsal or recovery controls.
