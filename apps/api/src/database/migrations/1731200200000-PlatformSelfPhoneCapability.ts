import { MigrationInterface, QueryRunner } from "typeorm";

export class PlatformSelfPhoneCapability1731200200000 implements MigrationInterface {
  name = "PlatformSelfPhoneCapability1731200200000";
  async up(q: QueryRunner) {
    const code = "platform.phone.self.manage";
    await q.query(`INSERT INTO permissions (id, code, description) SELECT lower(hex(randomblob(16))), ?, ? WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = ?)`, [code, "Platform administrators may change their own phone number without a review limit.", code]);
    await q.query(`INSERT INTO role_permissions (id, roleId, permissionId) SELECT lower(hex(randomblob(16))), r.id, p.id FROM roles r JOIN permissions p ON p.code = ? WHERE r.code = 'PLATFORM_ADMIN' AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.roleId = r.id AND rp.permissionId = p.id)`, [code]);
  }
  async down(): Promise<void> { throw new Error("Capabilities are retained for audit-safe rollback."); }
}
