import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

/** Preserve historical import rows while making approved version imports replay-safe. */
export class TimetableImportIdempotency1731000000000
  implements MigrationInterface
{
  name = "TimetableImportIdempotency1731000000000";

  async up(q: QueryRunner) {
    // Native additive DDL avoids a SQLite table rebuild. Existing rows retain a
    // unique legacy value because their original source rows were not persisted.
    await q.query(
      `ALTER TABLE "timetable_imports" ADD COLUMN "fingerprint" varchar(64) NOT NULL DEFAULT ''`,
    );
    await q.query(
      `UPDATE "timetable_imports" SET "fingerprint" = 'legacy-' || "id" WHERE "fingerprint" = ''`,
    );
    await q.createIndex(
      "timetable_imports",
      new TableIndex({
        name: "UQ_timetable_import_version_fingerprint",
        columnNames: ["versionId", "fingerprint"],
        isUnique: true,
      }),
    );
  }

  async down(): Promise<void> {
    throw new Error(
      "Timetable import provenance is forward-only. Roll application code back; preserve the replay-safe schema.",
    );
  }
}
