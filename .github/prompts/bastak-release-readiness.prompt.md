---
description: Assess Bastak School release readiness with source, CI, receiver, and production evidence kept separate.
---

# Release readiness review

Assess whether the requested Bastak School branch/commit is ready to release. Read `AGENTS.md`, inspect the dirty tree first, and distinguish local source evidence from CI, receiver, HTTPS, authorized smoke, backup, and production proof.

Check:

- backend lint/test/build and migration safety;
- admin typecheck/format/lint/test/a11y/build;
- student-core build/test;
- current shared Admin/Student host-routing checks (the historical `apps/student` app is absent);
- security regression coverage for affected boundaries;
- API/shared-contract compatibility;
- migration/deployment configuration;
- documentation/changelog/release notes;
- Graphify impact paths for high-risk changes when available;
- Bastak School brand metadata, PWA assets, Docker/Coolify labels, and documentation when identity changed.

Return blockers, warnings, evidence, and exact follow-up actions. Never mark release-ready based on unexecuted checks.
