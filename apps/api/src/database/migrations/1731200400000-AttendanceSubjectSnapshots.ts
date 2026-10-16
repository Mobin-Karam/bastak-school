import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive snapshots preserve timetable lesson meaning after catalog edits. */
export class AttendanceSubjectSnapshots1731200400000 implements MigrationInterface {
  name = "AttendanceSubjectSnapshots1731200400000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      "ALTER TABLE attendance_sessions ADD COLUMN subjectIdSnapshot varchar(120)",
    );
    await q.query(
      "ALTER TABLE attendance_sessions ADD COLUMN subjectNameSnapshot varchar(240)",
    );
    await q.query(
      "CREATE INDEX IDX_attendance_session_subject_date ON attendance_sessions(subjectIdSnapshot, sessionDate, id)",
    );
  }

  async down(): Promise<void> {
    throw new Error(
      "Attendance subject snapshots preserve historical meaning and cannot be removed.",
    );
  }
}
