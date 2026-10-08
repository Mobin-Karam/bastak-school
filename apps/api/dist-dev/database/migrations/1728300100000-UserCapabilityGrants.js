"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCapabilityGrants1728300100000 = void 0;
class UserCapabilityGrants1728300100000 {
    name = "UserCapabilityGrants1728300100000";
    async up(q) { await q.query("CREATE TABLE user_capability_grants (id varchar PRIMARY KEY NOT NULL, userId varchar NOT NULL, organizationId varchar NOT NULL, capability varchar(100) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT FK_ucg_user FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT FK_ucg_organization FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE)"); await q.query("CREATE UNIQUE INDEX IDX_ucg_scope ON user_capability_grants(userId, organizationId, capability)"); }
    async down(q) { await q.query("DROP TABLE IF EXISTS user_capability_grants"); }
}
exports.UserCapabilityGrants1728300100000 = UserCapabilityGrants1728300100000;
//# sourceMappingURL=1728300100000-UserCapabilityGrants.js.map