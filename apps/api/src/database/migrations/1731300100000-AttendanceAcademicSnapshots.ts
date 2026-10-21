import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive academic snapshots keep historical sessions independent of later timetable edits. */
export class AttendanceAcademicSnapshots1731300100000 implements MigrationInterface {
  name = "AttendanceAcademicSnapshots1731300100000";

  async up(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE attendance_sessions ADD COLUMN academicYearIdSnapshot varchar(36)");
    await q.query("ALTER TABLE attendance_sessions ADD COLUMN academicYearNameSnapshot varchar(240)");
    await q.query("ALTER TABLE attendance_sessions ADD COLUMN termIdSnapshot varchar(36)");
    await q.query("ALTER TABLE attendance_sessions ADD COLUMN termNameSnapshot varchar(240)");
    await q.query("CREATE INDEX IDX_attendance_session_academic_date ON attendance_sessions(academicYearIdSnapshot, termIdSnapshot, sessionDate, id)");
  }

  async down(): Promise<void> {
    throw new Error("Attendance academic snapshots preserve historical meaning and cannot be removed.");
  }
}
