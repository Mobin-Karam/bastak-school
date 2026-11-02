import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive tables only: no existing attendance rows are changed or backfilled. */
export class AttendanceSupervisorChecks1762100000000 implements MigrationInterface {
  name = "AttendanceSupervisorChecks1762100000000";

  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE attendance_supervisor_checks (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, sessionId varchar NOT NULL, supervisorId varchar NOT NULL, entries text NOT NULL DEFAULT '[]', revision integer NOT NULL DEFAULT 0, submittedAt datetime, createdAt datetime NOT NULL DEFAULT (datetime('now')), updatedAt datetime NOT NULL DEFAULT (datetime('now')), FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE, FOREIGN KEY(sessionId) REFERENCES attendance_sessions(id) ON DELETE CASCADE, FOREIGN KEY(supervisorId) REFERENCES users(id) ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE UNIQUE INDEX UQ_attendance_supervisor_check_session_supervisor ON attendance_supervisor_checks(sessionId, supervisorId)`,
    );
    await q.query(
      `CREATE INDEX IDX_attendance_supervisor_check_org_created ON attendance_supervisor_checks(organizationId, createdAt)`,
    );
  }

  async down(q: QueryRunner) {
    await q.query(`DROP TABLE attendance_supervisor_checks`);
  }
}
