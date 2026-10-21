import { MigrationInterface, QueryRunner } from "typeorm";

/** Forward-only: corrections are new append-only evidence; existing attendance facts are untouched. */
export class AttendanceCorrections1730600000000 implements MigrationInterface {
  name = "AttendanceCorrections1730600000000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE attendance_corrections (
      id varchar PRIMARY KEY NOT NULL,
      sessionId varchar NOT NULL,
      recordId varchar NOT NULL,
      actorId varchar NOT NULL,
      requestId varchar(36) NOT NULL,
      before text NOT NULL,
      after text NOT NULL,
      reason text NOT NULL,
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(sessionId) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(recordId) REFERENCES attendance_records(id) ON DELETE CASCADE,
      FOREIGN KEY(actorId) REFERENCES users(id) ON DELETE RESTRICT
    )`);
    await q.query(
      "CREATE INDEX IDX_attendance_correction_record_created ON attendance_corrections(recordId, createdAt, id)",
    );
    await q.query(
      "CREATE UNIQUE INDEX UQ_attendance_correction_record_actor_request ON attendance_corrections(recordId, actorId, requestId)",
    );
  }

  async down(): Promise<void> {
    throw new Error(
      "Attendance corrections are append-only operational evidence and cannot be deleted by rollback.",
    );
  }
}
