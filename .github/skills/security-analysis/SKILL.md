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
