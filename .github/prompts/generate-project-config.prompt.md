---
description: Generate stack-specific CI, Dependabot, CODEOWNERS guidance, and repository configuration after project discovery.
---
Run `AGENTS.md`, Graphify, and repository discovery first. Based only on detected package managers, runtimes, app roots, test/build commands, deployment model, and repository ownership information actually available, propose or generate stack-specific Bastak School CI, Dependabot, Codex/GitHub guidance, and related configuration. Preserve the leaf-lockfile workspace model, `/api/v2`, CMB boundaries, local-only secret configuration, and protected `develop` → `main` promotion flow. Do not guess usernames, branches, registries, secrets, production environments, or unsupported runtime versions.
