import { MigrationInterface, QueryRunner } from "typeorm";

/** Grants the audited in-school resolution action only to school administrators. */
export class PrincipalStudentMovementResolution1763600200000 implements MigrationInterface {
  name = "PrincipalStudentMovementResolution1763600200000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const capability = "student.movement.resolve";
    await queryRunner.query(
      "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'Confirm a student is physically in school')",
      [capability],
    );
    for (const role of ["PRINCIPAL", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"]) {
      await queryRunner.query(
        "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?",
        [role, capability],
      );
    }
  }

  async down(): Promise<void> {
    // Keep shared or manually assigned permissions intact during rollback.
  }
}
