---
name: database-analysis
description: Analyze data models, queries, constraints, indexes, transactions, migrations, lifecycle, tenancy, and operational safety across database technologies.
---

# Database Analysis Skill

The API uses TypeORM. Treat entity, migration, service/DTO, ownership scope, and fresh-database test changes as one persistence slice.

## Workflow
1. Detect database engine(s) and schema source of truth.
2. Inspect models/schema, migration history, seeds, and data-access layer.
3. Map important relationships, ownership, constraints, and access patterns.
4. Check integrity, nullability/defaults, uniqueness, cascades, and transaction boundaries.
5. Evaluate indexes using real filters/joins/sorts and query plans when available.
6. Review migration rollout/backfill/rollback or forward-repair safety.
7. Consider backup/restore and retention only when operationally relevant.

## Production migration boundary

Database changes are operationally relevant when they can ship. For every migration, inspect the populated-data and recovery contract in `docs/operations/development-to-production.md` and `scripts/deploy/database-recovery.cjs`. Verify pre-existing records survive a restored-copy rehearsal; allow only the migration's explicit default/null/repair values and test that unrelated changes fail closed. Do not infer production safety from a fresh database, and never recommend reset/seed, direct production schema edits, automatic rollback, or blind migration retry.
