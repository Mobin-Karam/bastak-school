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
