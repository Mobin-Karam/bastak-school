import { MigrationInterface, QueryRunner } from "typeorm";
export class TimetableSubstitutionRequests1761700000000 implements MigrationInterface {
  name = "TimetableSubstitutionRequests1761700000000";
  async up(q: QueryRunner) {
    await q.query(
      `CREATE TABLE timetable_substitution_requests (id varchar PRIMARY KEY NOT NULL, versionId varchar NOT NULL, lessonId varchar NOT NULL, freezeDate varchar(10) NOT NULL, replacementDate varchar(10) NOT NULL, replacementStartTime varchar(5) NOT NULL, replacementEndTime varchar(5) NOT NULL, title varchar(240) NOT NULL, message text NOT NULL DEFAULT '', status varchar(12) NOT NULL DEFAULT 'pending', requestedById varchar NOT NULL, reviewedById varchar, reviewedAt datetime, createdAt datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await q.query(
      `CREATE UNIQUE INDEX UQ_timetable_substitution_occurrence ON timetable_substitution_requests(versionId, lessonId, freezeDate)`,
    );
  }
  async down(q: QueryRunner) {
    await q.query(`DROP TABLE timetable_substitution_requests`);
  }
}
