import { MigrationInterface, QueryRunner } from "typeorm";
export class UserCapabilityGrants1728300100000 implements MigrationInterface {
  name = "UserCapabilityGrants1728300100000";
  async up(q: QueryRunner) { await q.query("CREATE TABLE user_capability_grants (id varchar PRIMARY KEY NOT NULL, userId varchar NOT NULL, organizationId varchar NOT NULL, capability varchar(100) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_ucg_user FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT FK_ucg_organization FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE)"); await q.query("CREATE UNIQUE INDEX IDX_ucg_scope ON user_capability_grants(userId, organizationId, capability)"); }
  async down(q: QueryRunner) { await q.query("DROP TABLE IF EXISTS user_capability_grants"); }
}
