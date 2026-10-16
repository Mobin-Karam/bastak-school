import { MigrationInterface, QueryRunner } from "typeorm";

/** Add the nullable reviewer FK without rewriting or discarding correction history. */
export class AttendanceCorrectionReviewIntegrity1731300300000
  implements MigrationInterface
{
  name = "AttendanceCorrectionReviewIntegrity1731300300000";
  transaction = false;

  async up(q: QueryRunner): Promise<void> {
    if (q.isTransactionActive)
      throw new Error("Attendance correction integrity migration requires per-migration transactions.");
    await q.query("PRAGMA foreign_keys = OFF");
    try {
      await q.startTransaction();
      await q.query(`UPDATE attendance_corrections SET reviewedById=NULL
        WHERE reviewedById IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE id=attendance_corrections.reviewedById)`);
      await q.query(`CREATE TABLE attendance_corrections_next (
        id varchar PRIMARY KEY NOT NULL, sessionId varchar NOT NULL, recordId varchar NOT NULL,
        actorId varchar NOT NULL, requestId varchar(36) NOT NULL, before text NOT NULL, after text NOT NULL,
        reason text NOT NULL, status varchar(16) NOT NULL DEFAULT 'approved', reviewedById varchar(36),
        reviewRequestId varchar(36), reviewNote text NOT NULL DEFAULT '', reviewedAt datetime,
        createdAt datetime NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(sessionId) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY(recordId) REFERENCES attendance_records(id) ON DELETE CASCADE,
        FOREIGN KEY(actorId) REFERENCES users(id) ON DELETE RESTRICT,
        FOREIGN KEY(reviewedById) REFERENCES users(id) ON DELETE RESTRICT
      )`);
      await q.query(`INSERT INTO attendance_corrections_next(id,sessionId,recordId,actorId,requestId,before,after,reason,status,reviewedById,reviewRequestId,reviewNote,reviewedAt,createdAt)
        SELECT id,sessionId,recordId,actorId,requestId,before,after,reason,status,reviewedById,reviewRequestId,reviewNote,reviewedAt,createdAt FROM attendance_corrections`);
      await q.query("DROP TABLE attendance_corrections");
      await q.query("ALTER TABLE attendance_corrections_next RENAME TO attendance_corrections");
      await q.query("CREATE INDEX IDX_attendance_correction_record_created ON attendance_corrections(recordId, createdAt, id)");
      await q.query("CREATE UNIQUE INDEX UQ_attendance_correction_record_actor_request ON attendance_corrections(recordId, actorId, requestId)");
      await q.query("CREATE INDEX IDX_attendance_correction_pending ON attendance_corrections(status, createdAt, id)");
      if ((await q.query("PRAGMA foreign_key_check")).length) throw new Error("Attendance correction foreign key check failed.");
      await q.commitTransaction();
    } catch (error) {
      if (q.isTransactionActive) await q.rollbackTransaction();
      throw error;
    } finally {
      await q.query("PRAGMA foreign_keys = ON");
    }
  }

  async down(): Promise<void> {
    throw new Error("Attendance correction reviewer integrity is forward-only.");
  }
}
