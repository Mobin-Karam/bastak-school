import { MigrationInterface, QueryRunner } from "typeorm";

/** Allows an AM and PM block to share a name without weakening same-half-day uniqueness. */
export class SchoolScheduleTimeBlockPartOfDay1731800100000 implements MigrationInterface {
  name = "SchoolScheduleTimeBlockPartOfDay1731800100000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(school_schedule_time_blocks)",
    )) as Array<{ name?: string }>;
    if (!columns.some((column) => column.name === "partOfDay")) {
      await queryRunner.query(
        "ALTER TABLE school_schedule_time_blocks ADD COLUMN partOfDay varchar(2) NOT NULL DEFAULT 'AM'",
      );
    }
    await queryRunner.query(
      "UPDATE school_schedule_time_blocks SET partOfDay = CASE WHEN startTime < '12:00' THEN 'AM' ELSE 'PM' END",
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_schedule_time_block_organization_name"',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_schedule_time_block_organization_name_part" ON "school_schedule_time_blocks" ("organizationId", "name", "partOfDay")',
    );
  }

  async down(): Promise<void> {
    // Keep the derived classification to preserve existing time-block identity.
  }
}
