import { MigrationInterface, QueryRunner } from "typeorm";

export class RelaxationTargeting1724145900000 implements MigrationInterface {
  name = "RelaxationTargeting1724145900000";
  async up(q: QueryRunner): Promise<void> {
    await q.query("ALTER TABLE relaxation_tracks ADD COLUMN organizationId varchar");
    await q.query("ALTER TABLE relaxation_tracks ADD COLUMN gradeIds text");
    await q.query("ALTER TABLE relaxation_tracks ADD COLUMN availableFrom varchar(10)");
    await q.query("ALTER TABLE relaxation_tracks ADD COLUMN availableUntil varchar(10)");
    await q.query("CREATE INDEX IF NOT EXISTS IDX_relaxation_tracks_organization ON relaxation_tracks(organizationId)");
  }
  async down(q: QueryRunner): Promise<void> { await q.query("DROP INDEX IF EXISTS IDX_relaxation_tracks_organization"); }
}
