import { MigrationInterface, QueryRunner } from "typeorm";

/** Additive tables only. Existing sessions/marks and the operational-day policy are untouched. */
export class AttendanceDelegatesAndPools1730400000000 implements MigrationInterface {
  name = "AttendanceDelegatesAndPools1730400000000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE dorm_attendance_delegates (
      id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, roomId varchar NOT NULL UNIQUE,
      studentId varchar NOT NULL, grantedById varchar, startsOn varchar(10) NOT NULL, endsOn varchar(10) NOT NULL,
      revoked boolean NOT NULL DEFAULT 0, createdAt datetime NOT NULL DEFAULT (datetime('now')),
      updatedAt datetime NOT NULL DEFAULT (datetime('now')), CHECK (startsOn <= endsOn),
      FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY(roomId) REFERENCES dorm_rooms(id) ON DELETE CASCADE,
      FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(grantedById) REFERENCES users(id) ON DELETE SET NULL
    )`);
    await q.query(
      "CREATE INDEX IDX_dorm_delegate_student ON dorm_attendance_delegates(studentId, revoked)",
    );
    await q.query(`CREATE TABLE attendance_pools (
      id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, sessionId varchar NOT NULL UNIQUE,
      place varchar(160) NOT NULL, endsAt datetime NOT NULL, closedAt datetime,
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY(sessionId) REFERENCES attendance_sessions(id) ON DELETE CASCADE
    )`);
    await q.query(
      "CREATE INDEX IDX_attendance_pool_expiry ON attendance_pools(organizationId, endsAt)",
    );
  }
  async down(q: QueryRunner): Promise<void> {
    // Rolling back after use would destroy delegation/check-in history. Empty-schema rollback is safe.
    for (const table of ["attendance_pools", "dorm_attendance_delegates"])
      if (
        (await q.query(`SELECT COUNT(*) AS count FROM ${table}`))[0].count > 0
      )
        throw new Error(
          "Attendance operations contain saved data; use an application rollback instead.",
        );
    await q.query("DROP TABLE attendance_pools");
    await q.query("DROP TABLE dorm_attendance_delegates");
  }
}
