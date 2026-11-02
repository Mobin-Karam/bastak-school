import { MigrationInterface, QueryRunner } from "typeorm";

/** Stores the principal's explanation request on the durable attendance review record. */
export class AttendanceReviewTeacherMessage1762400000000 implements MigrationInterface {
  name = "AttendanceReviewTeacherMessage1762400000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(attendance_session_reviews)",
    )) as Array<{ name: string }>;
    // Attendance reviews are an optional workflow in retained databases.
    // Do not prevent an upgrade when its historical table was never created.
    if (
      !columns.length ||
      columns.some((column) => column.name === "teacherMessage")
    )
      return;
    await queryRunner.query(
      `ALTER TABLE attendance_session_reviews ADD COLUMN teacherMessage varchar(500) NOT NULL DEFAULT ''`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // SQLite does not support DROP COLUMN consistently across the versions
    // used by local, recovery, and production databases. Keep the compatible
    // nullable-use column during rollback; older code ignores it.
  }
}
