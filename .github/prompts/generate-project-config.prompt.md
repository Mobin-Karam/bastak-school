---
description: Generate stack-specific CI, Dependabot, CODEOWNERS guidance, and repository configuration after project discovery.
---
Run Graphify and repository discovery first. Based only on detected package managers, runtimes, app roots, test/build commands, deployment model, and repository ownership information actually available, propose or generate stack-specific CI, Dependabot, and related GitHub configuration. Preserve the leaf-lockfile workspace model and protected `develop` → `main` promotion flow. Do not guess usernames, branches, registries, secrets, production environments, or unsupported runtime versions.
