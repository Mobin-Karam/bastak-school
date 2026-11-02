import { MigrationInterface, QueryRunner } from "typeorm";

/** Nullable provenance only; no saved attendance is assigned to a term automatically. */
export class AttendanceHistoricalImportReason1762300200000 implements MigrationInterface {
  name = "AttendanceHistoricalImportReason1762300200000";
  async up(q: QueryRunner) {
    await q.query(
      `ALTER TABLE attendance_sessions ADD COLUMN historicalImportReason text`,
    );
  }
  async down(): Promise<void> {
    /* Preserve historical import audit data. */
  }
}
