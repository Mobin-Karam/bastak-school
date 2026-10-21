import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The Dormitory workspace is surfaced to school supervisors, but older role
 * migrations granted them the obsolete `dorms.*` codes instead of the active
 * `dormitory.*` capability pair. Grant the active scoped authorities without
 * removing any custom or historical grants.
 */
export class DormitorySupervisorCapabilities1731300200000 implements MigrationInterface {
  name = "DormitorySupervisorCapabilities1731300200000";

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const capability of ["dormitory.read", "dormitory.manage"]) {
      await queryRunner.query(
        "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'Dormitory supervisor capability')",
        [capability],
      );
      await queryRunner.query(
        "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='SCHOOL_SUPERVISOR' AND p.code=?",
        [capability],
      );
    }
  }

  async down(): Promise<void> {
    // Capability rows and grants may be shared or customized after deployment.
  }
}
