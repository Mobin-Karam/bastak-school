import { MigrationInterface, QueryRunner } from "typeorm";

/** Stores each school-lead review so attendance sessions can recur every 24 hours. */
export class DailyAttendanceSessionReview1731600000000 implements MigrationInterface {
  name = "DailyAttendanceSessionReview1731600000000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE attendance_session_reviews (
      id varchar(36) PRIMARY KEY NOT NULL,
      sessionId varchar(36) NOT NULL,
      reviewerId varchar(36),
      reviewedRevision integer NOT NULL,
      reviewedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT FK_attendance_session_review_session FOREIGN KEY(sessionId) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      CONSTRAINT FK_attendance_session_review_reviewer FOREIGN KEY(reviewerId) REFERENCES users(id) ON DELETE SET NULL
    )`);
    await q.query(
      "CREATE INDEX IDX_attendance_session_review_session_revision_date ON attendance_session_reviews(sessionId, reviewedRevision, reviewedAt)",
    );
    await q.query(
      "CREATE INDEX IDX_attendance_session_review_date ON attendance_session_reviews(reviewedAt)",
    );
    await q.query(
      "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),'attendance.review','Review attendance sessions')",
    );
    await q.query(
      "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='PRINCIPAL' AND p.code='attendance.review'",
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query("DROP INDEX IF EXISTS IDX_attendance_session_review_date");
    await q.query(
      "DROP INDEX IF EXISTS IDX_attendance_session_review_session_revision_date",
    );
    await q.query("DROP TABLE IF EXISTS attendance_session_reviews");
    // Keep permission grants; they may be used by manually configured roles.
  }
}
