import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Forward-only role correction for databases that already ran the school-home
 * migration. Keep supervisor permissions explicit so the Admin shell and API
 * agree about the operations a school supervisor can perform.
 */
export class SupervisorSchoolOperations1728600000000 implements MigrationInterface {
  name = "SupervisorSchoolOperations1728600000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const capabilities = [
      "students.read",
      "classes.read",
      "classes.manage",
      "classes.roster.manage",
      "schedule.read",
      "attendance.read",
      "attendance.manage",
      "prayer_times.read",
      "prayer_times.manage",
      "announcements.read",
      "announcements.manage",
    ];
    for (const capability of capabilities) {
      await queryRunner.query(
        "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'School supervisor operation')",
        [capability],
      );
      await queryRunner.query(
        "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='SCHOOL_SUPERVISOR' AND p.code=?",
        [capability],
      );
    }
  }

  async down(): Promise<void> {
    // Capability rows can be shared or manually granted; never silently revoke them.
  }
}
