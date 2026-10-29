import { MigrationInterface, QueryRunner } from "typeorm";

/** Stores the principal's explanation request on the durable attendance review record. */
export class AttendanceReviewTeacherMessage1762400000000 implements MigrationInterface {
  name = "AttendanceReviewTeacherMessage1762400000000";

  async up(queryRunner: QueryRunner): Promise<void> {
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
