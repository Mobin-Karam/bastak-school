import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Forward-only correction approval evidence. Existing corrections were already
 * applied under the prior policy, so they are preserved as approved facts.
 */
export class AttendanceCorrectionReview1731300000000 implements MigrationInterface {
  name = "AttendanceCorrectionReview1731300000000";

  async up(q: QueryRunner): Promise<void> {
    await q.query(
      "ALTER TABLE attendance_policies ADD COLUMN correctionRequiresReview boolean NOT NULL DEFAULT 0",
    );
    await q.query(
      "ALTER TABLE attendance_corrections ADD COLUMN status varchar(16) NOT NULL DEFAULT 'approved'",
    );
    await q.query("ALTER TABLE attendance_corrections ADD COLUMN reviewedById varchar(36)");
    await q.query("ALTER TABLE attendance_corrections ADD COLUMN reviewRequestId varchar(36)");
    await q.query(
      "ALTER TABLE attendance_corrections ADD COLUMN reviewNote text NOT NULL DEFAULT ''",
    );
    await q.query("ALTER TABLE attendance_corrections ADD COLUMN reviewedAt datetime");
    await q.query(
      "CREATE INDEX IDX_attendance_correction_pending ON attendance_corrections(status, createdAt, id)",
    );
  }

  async down(): Promise<void> {
    // Correction approval evidence is intentionally retained; production rollback must not erase audit data.
  }
}
