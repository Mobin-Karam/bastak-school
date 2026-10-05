import { MigrationInterface, QueryRunner } from "typeorm";

export class PlanTemplates1724145600000 implements MigrationInterface {
  name = "PlanTemplates1724145600000";
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE plan_templates (id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, authorId varchar, title varchar(180) NOT NULL, description text NOT NULL DEFAULT '', state varchar(20) NOT NULL DEFAULT 'DRAFT', version integer NOT NULL DEFAULT 1, tags text NOT NULL DEFAULT '[]', days text NOT NULL DEFAULT '[]', createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_plan_templates_org FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE, CONSTRAINT FK_plan_templates_author FOREIGN KEY(authorId) REFERENCES users(id) ON DELETE SET NULL)`);
    await q.query(`CREATE INDEX IDX_plan_templates_org_state ON plan_templates(organizationId,state)`);
    for (const code of ["plan_templates.read", "plan_templates.manage", "plan_templates.publish"]) await q.query(`INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'')`, [code]);
    for (const [role, codes] of Object.entries({ TEACHER: ["plan_templates.read"], ADVISOR: ["plan_templates.read", "plan_templates.manage"], ORGANIZATION_ADMIN: ["plan_templates.read", "plan_templates.manage", "plan_templates.publish"], PLATFORM_ADMIN: ["plan_templates.read", "plan_templates.manage", "plan_templates.publish"] })) for (const code of codes) await q.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?`, [role,code]);
  }
  async down(q: QueryRunner): Promise<void> { await q.query(`DROP TABLE IF EXISTS plan_templates`); }
}
