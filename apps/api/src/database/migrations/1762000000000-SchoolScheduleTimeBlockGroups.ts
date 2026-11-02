import { MigrationInterface, QueryRunner } from "typeorm";

/** Replaces fixed morning/afternoon buckets with organization-managed time-block groups. */
export class SchoolScheduleTimeBlockGroups1762000000000 implements MigrationInterface {
  name = "SchoolScheduleTimeBlockGroups1762000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "school_schedule_time_block_groups" ("id" varchar(36) PRIMARY KEY NOT NULL, "organizationId" varchar(36) NOT NULL, "name" varchar(80) NOT NULL, "createdAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE)',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_schedule_time_block_group_organization_name" ON "school_schedule_time_block_groups" ("organizationId", "name")',
    );
    const columns = (await queryRunner.query(
      "PRAGMA table_info(school_schedule_time_blocks)",
    )) as Array<{ name?: string }>;
    if (!columns.some((column) => column.name === "groupId")) {
      await queryRunner.query(
        'ALTER TABLE "school_schedule_time_blocks" ADD COLUMN "groupId" varchar(36)',
      );
    }
    await queryRunner.query(
      `INSERT OR IGNORE INTO "school_schedule_time_block_groups" ("id", "organizationId", "name")
       SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))), "organizationId", CASE WHEN "partOfDay" = 'PM' THEN 'عصر' ELSE 'صبح' END
       FROM "school_schedule_time_blocks"
       GROUP BY "organizationId", CASE WHEN "partOfDay" = 'PM' THEN 'عصر' ELSE 'صبح' END`,
    );
    await queryRunner.query(
      `UPDATE "school_schedule_time_blocks"
       SET "groupId" = (
         SELECT groups."id" FROM "school_schedule_time_block_groups" groups
         WHERE groups."organizationId" = "school_schedule_time_blocks"."organizationId"
           AND groups."name" = CASE WHEN "school_schedule_time_blocks"."partOfDay" = 'PM' THEN 'عصر' ELSE 'صبح' END
       )
       WHERE "groupId" IS NULL`,
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_schedule_time_block_organization_name_part"',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_schedule_time_block_organization_group_name" ON "school_schedule_time_blocks" ("organizationId", "groupId", "name")',
    );
  }

  async down(): Promise<void> {
    // Keep groups and assignments on rollback so saved time-block identity is not lost.
  }
}
