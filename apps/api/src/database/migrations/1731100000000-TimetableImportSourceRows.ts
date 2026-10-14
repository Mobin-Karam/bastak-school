import { MigrationInterface, QueryRunner } from "typeorm";

/** Retain submitted workbook labels without making them persistence authority. */
export class TimetableImportSourceRows1731100000000 implements MigrationInterface {
  name = "TimetableImportSourceRows1731100000000";

  async up(q: QueryRunner) {
    // Additive native DDL preserves existing import audit history on SQLite.
    await q.query(
      `ALTER TABLE "timetable_imports" ADD COLUMN "sourceRows" text NOT NULL DEFAULT '[]'`,
    );
  }

  async down(): Promise<void> {
    throw new Error(
      "Timetable import provenance is forward-only. Roll application code back; preserve the audit schema.",
    );
  }
}
