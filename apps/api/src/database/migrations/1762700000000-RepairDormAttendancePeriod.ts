import { MigrationInterface, QueryRunner } from "typeorm";

/** Repairs partially applied dorm-session schema without touching attendance rows. */
export class RepairDormAttendancePeriod1762700000000
  implements MigrationInterface
{
  name = "RepairDormAttendancePeriod1762700000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(attendance_sessions)",
    )) as Array<{ name: string }>;
    if (!columns.some((column) => column.name === "attendancePeriod")) {
      await queryRunner.query(
        "ALTER TABLE attendance_sessions ADD COLUMN attendancePeriod varchar(8)",
      );
    }
  }

  async down(): Promise<void> {
    // This additive repair is forward-only for SQLite compatibility.
  }
}
