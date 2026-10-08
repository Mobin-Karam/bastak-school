import { MigrationInterface, QueryRunner } from "typeorm";

/** Adds عصر to the existing six-time daily school prayer schedule. */
export class AddSchoolAsrPrayerTime1729100000000 implements MigrationInterface {
  name = "AddSchoolAsrPrayerTime1729100000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE school_prayer_times ADD COLUMN asr varchar(5) NOT NULL DEFAULT ''",
    );
  }

  async down(): Promise<void> {
    // SQLite cannot drop a column safely without rebuilding a table that may
    // contain school data. This migration is intentionally forward-only.
  }
}
