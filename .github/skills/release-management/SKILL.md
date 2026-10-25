---
name: release-management
description: Prepare releases safely by validating versions, changelogs, migrations, compatibility, tests, builds, artifacts, and deployment prerequisites.
---

# Release Management Skill

Validate with the workspace DAG and distinguish source checks, CI, deployment dispatch, live integrations, and production health. Releases promote `develop` to `main` through the protected PR path.

## Release checklist
- determine project versioning/release policy
- summarize user-visible changes
- identify breaking changes/deprecations
- review migrations and environment/config changes
- review dependency/security changes
- run required tests/build/package checks
- update changelog/release notes if the project uses them
- verify artifact/version consistency
- list deployment and rollback/forward-repair notes

Do not tag, publish, push, or deploy unless explicitly requested.

## Failed-release loop

When a PR, promotion, or release gate fails, identify the exact failed job and current SHA, repair the first demonstrated root cause through the normal branch path, reproduce the focused command, and require fresh qualification after pushing. Never retry/push a release based on stale success, bypass a required check, or convert a failed preflight into an optional warning without source-backed scope evidence.

## Production evidence

Use `docs/operations/release-evidence.md` and `docs/operations/ci-cd-pipeline.md` for every release. Require reviewed merge-commit `develop` to `main` promotion, exact-SHA CI/artifact evidence, source dispatch, independent private receiver success, receipt/backup, trusted HTTPS readiness, and an authorized production workflow. Record each layer separately; a local check, CI run, artifact upload, or dispatch is not a deployment result. Every migration also needs populated upgrade and backup/restore rehearsal with a deliberate recovery path.
