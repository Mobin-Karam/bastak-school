import { MigrationInterface, QueryRunner } from "typeorm";

/** Legacy schedule academic cycles; existing schedule rows deliberately stay unmapped. */
export class LegacyScheduleAcademicCycles1762300000000 implements MigrationInterface {
  name = "LegacyScheduleAcademicCycles1762300000000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE school_academic_years (id varchar(36) PRIMARY KEY NOT NULL, organizationId varchar(36) NOT NULL, name varchar(120) NOT NULL, startsOn varchar(10) NOT NULL, endsOn varchar(10) NOT NULL, state varchar(16) NOT NULL DEFAULT 'DRAFT', createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE)`,
    );
    await q.query(
      `CREATE UNIQUE INDEX UQ_school_academic_year_org_name ON school_academic_years(organizationId, name)`,
    );
    await q.query(
      `CREATE UNIQUE INDEX UQ_school_academic_year_one_active ON school_academic_years(organizationId) WHERE state = 'ACTIVE'`,
    );
    await q.query(
      `CREATE TABLE school_academic_terms (id varchar(36) PRIMARY KEY NOT NULL, academicYearId varchar(36) NOT NULL, name varchar(120) NOT NULL, startsOn varchar(10) NOT NULL, endsOn varchar(10) NOT NULL, state varchar(16) NOT NULL DEFAULT 'DRAFT', correctionOpen boolean NOT NULL DEFAULT 0, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(academicYearId) REFERENCES school_academic_years(id) ON DELETE CASCADE)`,
    );
    await q.query(
      `CREATE UNIQUE INDEX UQ_school_academic_term_year_name ON school_academic_terms(academicYearId, name)`,
    );
    await q.query(
      `ALTER TABLE school_schedule_entries ADD COLUMN academicYearId varchar(36)`,
    );
    await q.query(
      `ALTER TABLE school_schedule_entries ADD COLUMN termId varchar(36)`,
    );
    await q.query(
      `CREATE INDEX IDX_legacy_schedule_entry_academic_term ON school_schedule_entries(academicYearId, termId)`,
    );
  }
  async down(): Promise<void> {
    /* Retain academic and historical schedule provenance. */
  }
}
