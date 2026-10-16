---
description: Database schema, query, migration, and persistence guidance.
applyTo: "apps/api/src/database/**,apps/api/src/modules/**/*.entity.ts,**/*.sql,**/*.prisma,**/migrations/**/*,**/schema/**/*"
---
# Database

- Detect the database engine, ORM/query layer, schema source of truth, migrations, seeds, and deployment model.
- Inspect existing data compatibility before schema changes.
- Prefer explicit constraints and indexes justified by real access patterns.
- Treat destructive migrations, large backfills, lock-heavy changes, and data rewrites as rollout-sensitive.
- Do not run destructive database commands without explicit authorization.
- For TypeORM changes, keep entity, migration, DTO/service consumers, authorization scope, and integration coverage synchronized; favor forward repair over data resets.
