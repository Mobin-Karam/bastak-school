import { MigrationInterface, QueryRunner } from "typeorm";

/** Nullable metadata only; existing leave requests and occurrence overrides remain unchanged. */
export class TeacherLeaveEarlyReturn1762200000000 implements MigrationInterface {
  name = "TeacherLeaveEarlyReturn1762200000000";

  async up(q: QueryRunner) {
    await q.query(
      `ALTER TABLE school_schedule_occurrence_overrides ADD COLUMN leaveRequestId varchar(36)`,
    );
    await q.query(
      `ALTER TABLE teacher_leave_requests ADD COLUMN returnDate varchar(10)`,
    );
    await q.query(
      `ALTER TABLE teacher_leave_requests ADD COLUMN returnMessage text`,
    );
    await q.query(
      `ALTER TABLE teacher_leave_requests ADD COLUMN returnStatus varchar(16)`,
    );
    await q.query(
      `ALTER TABLE teacher_leave_requests ADD COLUMN returnRequestedAt datetime`,
    );
    await q.query(
      `ALTER TABLE teacher_leave_requests ADD COLUMN returnReviewedAt datetime`,
    );
  }

  async down(q: QueryRunner) {
    // SQLite cannot safely drop these populated columns without rebuilding the table.
  }
}
