import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Repairs principal announcement access in databases where the principal role
 * was created after the original school-home capability migration ran.
 *
 * This only adds missing capability/grant rows. Existing permissions and role
 * assignments are left untouched.
 */
export class PrincipalAnnouncementManagementCapabilityRepair1762300700000 implements MigrationInterface {
  name = "PrincipalAnnouncementManagementCapabilityRepair1762300700000";

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const capability of ["announcements.read", "announcements.manage"]) {
      await queryRunner.query(
        "INSERT OR IGNORE INTO permissions(id, code, description) VALUES(lower(hex(randomblob(16))), ?, 'School announcement capability')",
        [capability],
      );
      await queryRunner.query(
        "INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId) SELECT lower(hex(randomblob(16))), role.id, permission.id FROM roles role JOIN permissions permission ON permission.code = ? WHERE role.code = 'PRINCIPAL'",
        [capability],
      );
    }
  }

  async down(): Promise<void> {
    // The grants may predate this repair. Keeping them is safer than removing
    // a principal's live capability during a rollback.
  }
}
