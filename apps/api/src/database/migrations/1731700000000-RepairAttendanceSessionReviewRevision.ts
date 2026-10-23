import { MigrationInterface, QueryRunner } from "typeorm";

/** Repairs databases where the daily-review migration was recorded before its revision column existed. */
export class RepairAttendanceSessionReviewRevision1731700000000 implements MigrationInterface {
  name = "RepairAttendanceSessionReviewRevision1731700000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const columns = (await queryRunner.query(
      "PRAGMA table_info(attendance_session_reviews)",
    )) as Array<{ name?: string }>;
    if (!columns.some((column) => column.name === "reviewedRevision")) {
      await queryRunner.query(
        "ALTER TABLE attendance_session_reviews ADD COLUMN reviewedRevision integer NOT NULL DEFAULT 0",
      );
    }
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_attendance_session_review_session_revision_date ON attendance_session_reviews(sessionId, reviewedRevision, reviewedAt)",
    );
  }

  async down(): Promise<void> {
    // Keep the additive column and index: review history is audit data and
    // dropping it would break every stored 24-hour review record.
  }
}
