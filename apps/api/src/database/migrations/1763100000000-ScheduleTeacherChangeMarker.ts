import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive audit fields; retained schedule rows remain valid without a backfill. */
export class ScheduleTeacherChangeMarker1763100000000 implements MigrationInterface {
  name = "ScheduleTeacherChangeMarker1763100000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(school_schedule_entries)",
    )) as Array<{ name: string }>;
    if (
      !columns.some((column) => column.name === "previousTeacherNameSnapshot")
    ) {
      await queryRunner.query(
        "ALTER TABLE school_schedule_entries ADD COLUMN previousTeacherNameSnapshot varchar(240)",
      );
    }
    if (!columns.some((column) => column.name === "teacherChangedAt")) {
      await queryRunner.query(
        "ALTER TABLE school_schedule_entries ADD COLUMN teacherChangedAt datetime",
      );
    }
  }

  async down(): Promise<void> {
    // SQLite cannot safely drop columns in-place; preserve additive audit data on rollback.
  }
}
