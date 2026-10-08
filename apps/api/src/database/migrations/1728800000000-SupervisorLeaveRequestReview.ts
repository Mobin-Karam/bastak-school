import { MigrationInterface, QueryRunner } from "typeorm";

/** Grants the supervisor the capability-gated endpoint access for school-exit requests. */
export class SupervisorLeaveRequestReview1728800000000 implements MigrationInterface {
  name = "SupervisorLeaveRequestReview1728800000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const capability of ["leave.read", "leave.manage"]) {
      await queryRunner.query(
        "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'Supervisor leave-review capability')",
        [capability],
      );
      await queryRunner.query(
        "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='SCHOOL_SUPERVISOR' AND p.code=?",
        [capability],
      );
    }
  }

  async down(): Promise<void> {
    // Do not revoke a shared or manually granted permission on rollback.
  }
}
