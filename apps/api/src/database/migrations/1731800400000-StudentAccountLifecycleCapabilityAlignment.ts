import { MigrationInterface, QueryRunner } from "typeorm";

/** Align the legacy school-admin delete grant with the non-destructive archive route. */
export class StudentAccountLifecycleCapabilityAlignment1731800400000 implements MigrationInterface {
  name = "StudentAccountLifecycleCapabilityAlignment1731800400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const code of ["students.read", "students.archive"])
      await queryRunner.query(
        "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,?)",
        [
          code,
          code === "students.archive"
            ? "Archive a student account while retaining its history"
            : "Read student records",
        ],
      );

    for (const code of ["students.read", "students.archive"])
      await queryRunner.query(
        "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='SCHOOL_ADMIN' AND p.code=?",
        [code],
      );
  }

  async down(): Promise<void> {
    // Keep grants on rollback: they can be explicitly assigned to a role.
  }
}
