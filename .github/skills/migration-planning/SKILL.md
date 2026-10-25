---
name: migration-planning
description: Plan safe schema, data, API, dependency, or architecture migrations with compatibility phases, backfills, validation, and rollback/forward-repair.
---

# Migration Planning Skill

For TypeORM/API migrations, include entity and migration order, scope/authorization invariants, contract consumers, fresh-database coverage, and a forward-repair path; never reset production data to force rollout.

## Plan template
- current state and target state
- compatibility constraints
- affected producers/consumers/data
- expand phase
- data backfill/dual-write/translation if needed
- cutover and validation
- contract/deprecation phase
- cleanup/contract phase
- observability and abort criteria
- rollback or forward-repair strategy

Prefer incremental migrations over flag-day changes when production compatibility matters.

## Production rehearsal

For every API migration, apply `docs/operations/development-to-production.md` and `docs/database/migration-preservation-coverage.md`. Classify effects on existing populated rows, old/new application compatibility, constraints and bounded backfills; then require fresh, populated-upgrade, and restored-copy backup/recovery rehearsal. When legacy rows change, add only exact migration-specific permissions to `scripts/deploy/database-recovery.cjs` plus a regression test; never use a wildcard or invent an allowance for schema-only work. A failed rehearsal blocks release: preserve backups and choose reviewed forward repair or recovery, never reset, seed, or blindly retry production.
