import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * New reviews receive a stable revision identity. Existing review rows retain
 * their historical shape, including any older duplicate evidence, so this
 * migration does not delete or rewrite retained attendance data.
 */
export class AttendanceRevisionReviewIdempotency1763600400000 implements MigrationInterface {
  name = "AttendanceRevisionReviewIdempotency1763600400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(attendance_session_reviews)",
    )) as Array<{ name: string }>;
    // Some retained installations predate the optional review workflow. Its
    // table is therefore absent even though this additive migration is later
    // in their migration history. Do not make deployment depend on a feature
    // they have never enabled.
    if (!columns.length) return;

    if (!columns.some((column) => column.name === "dedupeKey"))
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
