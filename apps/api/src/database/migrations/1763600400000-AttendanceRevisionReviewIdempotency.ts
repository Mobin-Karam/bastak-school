import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * New reviews receive a stable revision identity. Existing review rows retain
 * their historical shape, including any older duplicate evidence, so this
 * migration does not delete or rewrite retained attendance data.
 */
export class AttendanceRevisionReviewIdempotency1763600400000 implements MigrationInterface {
  name = "AttendanceRevisionReviewIdempotency1763600400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE attendance_session_reviews ADD COLUMN dedupeKey varchar(96)",
    );
    await queryRunner.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS IDX_attendance_session_review_dedupe ON attendance_session_reviews(dedupeKey)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX IF EXISTS IDX_attendance_session_review_dedupe",
    );
  }
}
