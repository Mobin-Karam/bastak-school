import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds explicit, queryable leave ownership without rewriting historical schedule
 * rows. Nullable columns preserve existing schedules and leave requests.
 */
export class TeacherLeaveWorkflowIntegrity1763400000000 implements MigrationInterface {
  name = "TeacherLeaveWorkflowIntegrity1763400000000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      `ALTER TABLE school_schedule_entries ADD COLUMN leaveRequestId varchar(36)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_schedule_entries_leave_request ON school_schedule_entries(leaveRequestId)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS IDX_schedule_occurrence_overrides_leave_request ON school_schedule_occurrence_overrides(leaveRequestId)`,
    );
    // SQLite cannot add a foreign key to a populated table without rebuilding
    // it. These guards provide the same write protection for both legacy and
    // fresh databases while retaining every historical schedule row.
    await queryRunner.query(
      `CREATE TRIGGER IF NOT EXISTS TRG_schedule_entries_leave_request_insert
       BEFORE INSERT ON school_schedule_entries
       WHEN NEW.leaveRequestId IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM teacher_leave_requests WHERE id = NEW.leaveRequestId)
       BEGIN SELECT RAISE(ABORT, 'invalid schedule leave request'); END`,
    );
    await queryRunner.query(
      `CREATE TRIGGER IF NOT EXISTS TRG_schedule_entries_leave_request_update
       BEFORE UPDATE OF leaveRequestId ON school_schedule_entries
       WHEN NEW.leaveRequestId IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM teacher_leave_requests WHERE id = NEW.leaveRequestId)
       BEGIN SELECT RAISE(ABORT, 'invalid schedule leave request'); END`,
    );
    await queryRunner.query(
      `CREATE TRIGGER IF NOT EXISTS TRG_schedule_overrides_leave_request_insert
       BEFORE INSERT ON school_schedule_occurrence_overrides
       WHEN NEW.leaveRequestId IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM teacher_leave_requests WHERE id = NEW.leaveRequestId)
       BEGIN SELECT RAISE(ABORT, 'invalid occurrence leave request'); END`,
    );
    await queryRunner.query(
      `CREATE TRIGGER IF NOT EXISTS TRG_schedule_overrides_leave_request_update
       BEFORE UPDATE OF leaveRequestId ON school_schedule_occurrence_overrides
       WHEN NEW.leaveRequestId IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM teacher_leave_requests WHERE id = NEW.leaveRequestId)
       BEGIN SELECT RAISE(ABORT, 'invalid occurrence leave request'); END`,
    );
    await queryRunner.query(
      `ALTER TABLE teacher_leave_requests ADD COLUMN updatedAt datetime`,
    );
  }

  async down(): Promise<void> {
    // SQLite cannot drop populated columns safely. Keep leave history intact.
  }
}
