import { MigrationInterface, QueryRunner } from "typeorm";

/** Existing legacy entries remain compatible; new entries retain cycle names. */
export class LegacyScheduleAcademicNameSnapshots1762300400000 implements MigrationInterface {
  name = "LegacyScheduleAcademicNameSnapshots1762300400000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE school_schedule_entries ADD COLUMN academicYearNameSnapshot varchar(120)`);
    await queryRunner.query(`ALTER TABLE school_schedule_entries ADD COLUMN termNameSnapshot varchar(120)`);
  }

  async down(): Promise<void> {
    /* Retain cycle provenance for historical schedule entries. */
  }
}
