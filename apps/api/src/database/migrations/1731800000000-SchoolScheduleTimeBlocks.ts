import { MigrationInterface, QueryRunner } from "typeorm";

export class SchoolScheduleTimeBlocks1731800000000 implements MigrationInterface {
  name = "SchoolScheduleTimeBlocks1731800000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE IF NOT EXISTS "school_schedule_time_blocks" ("id" varchar(36) PRIMARY KEY NOT NULL, "organizationId" varchar(36) NOT NULL, "name" varchar(80) NOT NULL, "startTime" varchar(5) NOT NULL, "endTime" varchar(5) NOT NULL, "createdAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE)',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_schedule_time_block_organization_name" ON "school_schedule_time_blocks" ("organizationId", "name")',
    );
  }

  async down(): Promise<void> {
    // Reusable blocks can be referenced by saved operating practice; retain them on rollback.
  }
}
