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
