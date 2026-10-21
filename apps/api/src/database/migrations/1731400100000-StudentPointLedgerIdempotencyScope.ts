import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Client request IDs are idempotent only for the same actor in the same
 * organization. Rebuild the SQLite table to persist that authority boundary.
 */
export class StudentPointLedgerIdempotencyScope1731400100000 implements MigrationInterface {
  name = "StudentPointLedgerIdempotencyScope1731400100000";
  transaction = false;

  async up(q: QueryRunner): Promise<void> {
    if (q.isTransactionActive)
      throw new Error(
        "Student-point ledger scope migration requires per-migration transactions.",
      );
    await q.query("PRAGMA foreign_keys = OFF");
    try {
      await q.startTransaction();
      await q.query(`CREATE TABLE student_point_ledger_next (
        id varchar PRIMARY KEY NOT NULL,
        points integer NOT NULL,
        source varchar(32) NOT NULL,
        requestId varchar,
        reason text NOT NULL,
        createdAt datetime NOT NULL DEFAULT (datetime('now')),
        studentId varchar NOT NULL,
        organizationId varchar NOT NULL,
        attendanceRecordId varchar,
        awardedById varchar,
        CONSTRAINT FK_student_point_ledger_student FOREIGN KEY(studentId) REFERENCES students(id) ON DELETE CASCADE,
        CONSTRAINT FK_student_point_ledger_organization FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT FK_student_point_ledger_attendance FOREIGN KEY(attendanceRecordId) REFERENCES attendance_records(id) ON DELETE CASCADE,
        CONSTRAINT FK_student_point_ledger_awarded_by FOREIGN KEY(awardedById) REFERENCES users(id) ON DELETE SET NULL
      )`);
      await q.query(`INSERT INTO student_point_ledger_next(id,points,source,requestId,reason,createdAt,studentId,organizationId,attendanceRecordId,awardedById)
        SELECT ledger.id,ledger.points,ledger.source,ledger.requestId,ledger.reason,ledger.createdAt,ledger.studentId,student.organizationId,ledger.attendanceRecordId,ledger.awardedById
        FROM student_point_ledger ledger
        INNER JOIN students student ON student.id=ledger.studentId`);
      await q.query("DROP TABLE student_point_ledger");
      await q.query(
        "ALTER TABLE student_point_ledger_next RENAME TO student_point_ledger",
      );
      await q.query(
        "CREATE UNIQUE INDEX UQ_student_point_ledger_attendance_record ON student_point_ledger(attendanceRecordId) WHERE attendanceRecordId IS NOT NULL",
      );
      await q.query(
        "CREATE INDEX IDX_student_point_ledger_student_created ON student_point_ledger(studentId,createdAt,id)",
      );
      await q.query(
        "CREATE UNIQUE INDEX UQ_student_point_ledger_request_scope ON student_point_ledger(organizationId,awardedById,requestId) WHERE requestId IS NOT NULL AND awardedById IS NOT NULL",
      );
      if ((await q.query("PRAGMA foreign_key_check")).length)
        throw new Error(
          "Student-point ledger scope migration foreign key check failed.",
        );
      await q.commitTransaction();
    } catch (error) {
      if (q.isTransactionActive) await q.rollbackTransaction();
      throw error;
    } finally {
      await q.query("PRAGMA foreign_keys = ON");
    }
  }

  async down(): Promise<void> {
    throw new Error("Student-point ledger idempotency scope is forward-only.");
  }
}
