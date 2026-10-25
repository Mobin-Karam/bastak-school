---
name: repository-discovery
description: Discover repository structure, languages, frameworks, package managers, applications, services, persistence, CI/CD, and project commands before implementation.
---

# Repository Discovery Skill

Read `AGENTS.md`, query Graphify when available, and use `tooling/workspace/projects.json` as the current project graph. `apps/student` is historical and absent; do not report it as an active component.

## Workflow
1. Inspect root files and manifests without traversing generated/vendor directories.
2. Detect package/workspace managers and monorepo configuration.
3. Identify applications, libraries, services, CLIs, mobile apps, and infrastructure roots.
4. Detect frameworks from dependencies/configuration, not directory names alone.
5. Locate test, lint, typecheck, format, build, migration, and start commands.
6. Locate persistence, authentication, external integrations, CI/CD, and deployment configuration.
7. Write `.agent-state/project.json` by running `.github/ai-toolkit/scripts/detect-project.sh` when possible.
8. Report verified facts and `UNKNOWN` items separately.

Do not edit product source during discovery unless the user explicitly asks for discovery metadata changes.

## Release discovery

For deployment or production questions, locate the complete evidence chain described in `docs/operations/ci-cd-pipeline.md`: branch policy, CI workflow, artifact, dispatch, private receiver template, host configuration boundary, migration/recovery scripts, receipt, and smoke checks. Report source facts separately from unavailable private repository or host facts, which are `UNKNOWN` until verified.
