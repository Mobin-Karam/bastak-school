---
name: feature-implementation
description: Implement a complete feature with repository discovery, contract tracing, minimal changes, tests, validation, and documentation.
---

# Feature Implementation Skill

For protected API/UI work, deliver a vertical slice: server authorization and organization scope, contract, consumer, and focused tests. Admin role-name visibility is never sufficient enforcement.

## Workflow
1. Clarify the desired observable behavior from the request and codebase.
2. Find existing related implementations and reusable components.
3. Trace required contracts across UI/API/database/integrations.
4. Identify edge/error/auth states.
5. Make the smallest cohesive implementation.
6. Add/update tests at the appropriate level.
7. Run targeted validation, then broader checks if shared code changed.
8. Update docs/config examples when behavior or setup changed.
9. Review the diff for unrelated edits and compatibility risks.

## Release-aware implementation

For changes to persistence, containers, proxy/cookies, Compose, workflows, configuration, or production dependencies, follow `docs/operations/development-to-production.md`. Include migration impact on populated data, recovery/rehearsal coverage, exact affected CI checks, external/private deployment-template publication when relevant, and evidence boundaries. Do not put production config/secrets in Git or report local/CI/dispatch success as production deployment.
