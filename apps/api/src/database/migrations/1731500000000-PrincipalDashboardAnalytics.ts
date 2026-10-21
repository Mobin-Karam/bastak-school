import { MigrationInterface, QueryRunner } from "typeorm";

/** Makes the existing, scoped analytics projection available to school principals. */
export class PrincipalDashboardAnalytics1731500000000 implements MigrationInterface {
  name = "PrincipalDashboardAnalytics1731500000000";
  async up(queryRunner: QueryRunner): Promise<void> {
    for (const capability of ["analytics.read", "student.profile.read"])
      await queryRunner.query(
        "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'Principal dashboard capability')",
        [capability],
      );
    for (const capability of ["analytics.read", "student.profile.read"])
      await queryRunner.query(
        "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='PRINCIPAL' AND p.code=?",
        [capability],
      );
  }
  async down(): Promise<void> {
    /* preserve explicit capability grants */
  }
}
