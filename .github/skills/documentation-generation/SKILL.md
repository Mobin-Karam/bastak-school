---
name: documentation-generation
description: Create accurate developer/user/architecture documentation from verified repository behavior and commands.
---

# Documentation Generation Skill

Use source and executed commands as authority. State that `apps/student` is historical/absent when relevant; do not convert architecture targets into current facts.

## Workflow
1. Identify audience and task they need to accomplish.
2. Verify implementation, commands, configuration keys, and paths.
3. Use existing documentation structure and terminology.
4. Prefer runnable examples and expected outcomes.
5. Document prerequisites, failure modes, and migration notes where relevant.
6. Link to deeper references instead of duplicating large blocks.
7. Review docs against current code before completion.

## Release and operations documentation

Use `docs/operations/ci-cd-pipeline.md`, `docs/operations/release-evidence.md`, and `docs/operations/development-to-production.md` as canonical release references. Keep local validation, CI, disposable rehearsal, source dispatch, private receiver, and live production evidence distinct. Mark unverified private/host state as `UNKNOWN`; never copy secrets or expanded production configuration, or document a bypass for protected promotion, backups, or migration recovery.
