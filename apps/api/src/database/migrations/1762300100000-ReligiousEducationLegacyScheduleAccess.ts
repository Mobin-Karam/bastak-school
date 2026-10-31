import { MigrationInterface, QueryRunner } from "typeorm";

/** Educational schedule administration only; principal-only operations remain service-gated. */
export class ReligiousEducationLegacyScheduleAccess1762300100000 implements MigrationInterface {
  name = "ReligiousEducationLegacyScheduleAccess1762300100000";
  async up(q: QueryRunner) {
    const codes = [
      "schedule.read",
      "schedule.create",
      "schedule.update",
      "schedule.delete",
      "schedule.archive",
      "schedule.import",
      "schedule.export",
      "schedule.publish",
    ];
    for (const code of codes) {
      await q.query(
        `INSERT OR IGNORE INTO permissions(id, code, description) VALUES(lower(hex(randomblob(16))), ?, ?)`,
        [code, code],
      );
      await q.query(
        `INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId) SELECT lower(hex(randomblob(16))), r.id, p.id FROM roles r, permissions p WHERE r.code = 'RELIGIOUS_EDUCATION_MANAGER' AND p.code = ?`,
        [code],
      );
    }
  }
  async down(): Promise<void> {
    /* additive permission history is retained */
  }
}
