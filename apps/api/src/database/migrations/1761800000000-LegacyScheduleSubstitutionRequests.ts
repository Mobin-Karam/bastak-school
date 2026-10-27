import { MigrationInterface, QueryRunner } from "typeorm";

export class LegacyScheduleSubstitutionRequests1761800000000 implements MigrationInterface {
  name = "LegacyScheduleSubstitutionRequests1761800000000";

  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE school_schedule_occurrence_overrides (id varchar PRIMARY KEY NOT NULL, entryId varchar NOT NULL, date varchar(10) NOT NULL, cancelled boolean NOT NULL DEFAULT 1, changedById varchar NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), FOREIGN KEY(entryId) REFERENCES school_schedule_entries(id) ON DELETE RESTRICT, FOREIGN KEY(changedById) REFERENCES users(id) ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE UNIQUE INDEX UQ_legacy_schedule_override_occurrence ON school_schedule_occurrence_overrides(entryId, date)`,
    );
    await q.query(
      `CREATE TABLE school_schedule_substitution_requests (id varchar PRIMARY KEY NOT NULL, sourceEntryId varchar NOT NULL, targetEntryId varchar NOT NULL, freezeDate varchar(10) NOT NULL, replacementDate varchar(10) NOT NULL, replacementTimeBlockId varchar NOT NULL, title varchar(160) NOT NULL, message text NOT NULL DEFAULT '', status varchar(12) NOT NULL DEFAULT 'pending', requestedById varchar NOT NULL, reviewedById varchar, reviewedAt datetime, replacementEntryId varchar, counterpartReplacementEntryId varchar, createdAt datetime NOT NULL DEFAULT (datetime('now')), FOREIGN KEY(sourceEntryId) REFERENCES school_schedule_entries(id) ON DELETE RESTRICT, FOREIGN KEY(targetEntryId) REFERENCES school_schedule_entries(id) ON DELETE RESTRICT, FOREIGN KEY(replacementTimeBlockId) REFERENCES school_schedule_time_blocks(id) ON DELETE RESTRICT, FOREIGN KEY(requestedById) REFERENCES users(id) ON DELETE RESTRICT, FOREIGN KEY(replacementEntryId) REFERENCES school_schedule_entries(id) ON DELETE RESTRICT, FOREIGN KEY(counterpartReplacementEntryId) REFERENCES school_schedule_entries(id) ON DELETE RESTRICT)`,
    );
    await q.query(
      `CREATE UNIQUE INDEX UQ_legacy_schedule_substitution_occurrence ON school_schedule_substitution_requests(sourceEntryId, freezeDate)`,
    );
  }

  async down(q: QueryRunner) {
    await q.query(`DROP TABLE school_schedule_substitution_requests`);
    await q.query(`DROP TABLE school_schedule_occurrence_overrides`);
  }
}
