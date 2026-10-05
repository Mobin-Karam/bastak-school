import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Planner access is intentionally split by responsibility: teachers can read
 * assigned schedules, advisors can author them, and organization/platform
 * administrators can operate the school-wide planning surface.
 */
export class PlanningRoleCapabilities1724145400000
  implements MigrationInterface
{
  name = "PlanningRoleCapabilities1724145400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      "plans.read",
      "plans.create",
      "plans.update",
      "plans.delete",
      "plans.publish",
      "tasks.read",
      "tasks.create",
      "tasks.update",
      "tasks.delete",
    ];
    const assignments: Record<string, string[]> = {
      TEACHER: ["plans.read", "tasks.read"],
      ORGANIZATION_ADMIN: permissions,
      PLATFORM_ADMIN: permissions,
    };

    for (const permission of permissions) {
      await queryRunner.query(
        "INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,?)",
        [permission, "Planning capability"],
      );
    }
    for (const [role, rolePermissions] of Object.entries(assignments)) {
      for (const permission of rolePermissions) {
        await queryRunner.query(
          "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?",
          [role, permission],
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const roles = ["TEACHER", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"];
    const permissions = [
      "plans.read",
      "plans.create",
      "plans.update",
      "plans.delete",
      "plans.publish",
      "tasks.read",
      "tasks.create",
      "tasks.update",
      "tasks.delete",
    ];
    for (const role of roles) {
      for (const permission of permissions) {
        await queryRunner.query(
          "DELETE FROM role_permissions WHERE roleId IN (SELECT id FROM roles WHERE code=?) AND permissionId IN (SELECT id FROM permissions WHERE code=?)",
          [role, permission],
        );
      }
    }
  }
}
