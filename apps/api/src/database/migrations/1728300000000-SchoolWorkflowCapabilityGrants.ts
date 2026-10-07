import { MigrationInterface, QueryRunner } from "typeorm";

/** Makes the school roles operational for leave, gate movement, and scoped access administration. */
export class SchoolWorkflowCapabilityGrants1728300000000 implements MigrationInterface {
  name = "SchoolWorkflowCapabilityGrants1728300000000";

  async up(q: QueryRunner): Promise<void> {
    const mapping: Record<string, string[]> = {
      PRINCIPAL: ["attendance.read", "attendance.manage", "leave.read", "leave.manage", "exit.read", "exit.manage", "principal.permissions.manage"],
      ORGANIZATION_ADMIN: ["attendance.read", "attendance.manage", "leave.read", "leave.manage", "exit.read", "exit.manage", "principal.permissions.manage"],
      DISCIPLINARIAN: ["attendance.read", "attendance.manage", "leave.read", "leave.manage", "exit.read", "exit.manage"],
      RELIGIOUS_EDUCATION_MANAGER: ["attendance.read", "attendance.manage"],
      GOVERNMENT_EDUCATION_MANAGER: ["attendance.read", "attendance.manage"],
      STUDENT_AFFAIRS_MENTOR: ["attendance.read"],
      TEACHER: ["attendance.read", "attendance.manage"],
      STUDENT: ["leave.read", "leave.manage", "exit.read", "exit.manage"],
    };
    for (const capability of new Set(Object.values(mapping).flat()))
      await q.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'')", [capability]);
    for (const [role, capabilities] of Object.entries(mapping)) for (const capability of capabilities)
      await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?", [role, capability]);
  }

  async down(q: QueryRunner): Promise<void> {
    // Permissions pre-date this additive migration in some installations. Removing
    // them here could silently revoke a manually assigned legacy role.
  }
}
