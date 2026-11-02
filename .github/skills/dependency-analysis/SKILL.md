---
name: dependency-analysis
description: Analyze dependency usage, duplication, licensing/security signals, upgrade impact, lockfiles, and safe dependency changes.
---

# Dependency Analysis Skill

This is a leaf-lockfile monorepo: `tooling/workspace/projects.json` is the package DAG. Do not add root npm workspaces or a root lockfile as a dependency-change side effect.

## Workflow
- Detect package manager and workspace boundaries.
- Confirm whether a dependency is direct, transitive, runtime, dev, or unused.
- Search actual imports/usages before removal.
- Check peer/runtime compatibility from local manifests/lockfiles and current documentation when external verification is needed.
- Upgrade in the smallest compatible step; identify breaking changes and migration work.
- Update lockfiles with the repository's package manager only.
- Run relevant tests/builds after changes.

## Release-aware dependency changes

For a production dependency, lockfile, base-image, or runtime upgrade, follow `docs/operations/development-to-production.md`: use the CI Node/runtime compatibility, run affected validation and disposable release rehearsal when images or runtime topology can change, and identify rollback/forward-repair implications. Do not rely on a host rebuild, mutable tag, or a local audit as production evidence; protected promotion and private deployment verification remain separate.
