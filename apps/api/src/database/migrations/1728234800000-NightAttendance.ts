import { MigrationInterface, QueryRunner } from "typeorm";

export class NightAttendance1728234800000 implements MigrationInterface {
  name = "NightAttendance1728234800000";

  async up(_queryRunner: QueryRunner): Promise<void> {
    // SQLite does not enforce the declared varchar length. Night/pool contexts
    // already fit the original text-affinity column, so no table rebuild is needed.
    // The old DROP TABLE cascaded deletion of existing attendance_records and
    // discarded custom indexes/triggers. Keep this historical ID for pending
    // upgrades; databases that already applied it are not replayed or rewritten.
    // New schema guarantees/index restoration belong to migration 1730800000000.
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    throw new Error(
      "Night attendance has no reversible schema change. Preserve all sessions and marks; use a compatible application rollback.",
    );
  }
}
