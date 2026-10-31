import { MigrationInterface, QueryRunner } from "typeorm";

/** Adds durable supervisor-to-principal review state to existing dorm sessions. */
export class DormAttendanceReviewHandoff1762600000000 implements MigrationInterface {
  name = "DormAttendanceReviewHandoff1762600000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE attendance_sessions ADD COLUMN attendancePeriod varchar(8)",
    );
    await queryRunner.query(
      "ALTER TABLE attendance_sessions ADD COLUMN dormSupervisorReviewedById varchar(36)",
    );
    await queryRunner.query(
      "ALTER TABLE attendance_sessions ADD COLUMN dormSupervisorReviewedAt datetime",
    );
    await queryRunner.query(
      "ALTER TABLE attendance_sessions ADD COLUMN dormSupervisorNote text",
    );
    await queryRunner.query(
      "ALTER TABLE attendance_sessions ADD COLUMN dormForwardedAt datetime",
    );
    await queryRunner.query(
      "ALTER TABLE attendance_sessions ADD COLUMN dormPrincipalReviewedById varchar(36)",
    );
    await queryRunner.query(
      "ALTER TABLE attendance_sessions ADD COLUMN dormPrincipalReviewedAt datetime",
    );
  }

  async down(): Promise<void> {
    // Keep additive nullable columns for SQLite compatibility; old code ignores them.
  }
}
