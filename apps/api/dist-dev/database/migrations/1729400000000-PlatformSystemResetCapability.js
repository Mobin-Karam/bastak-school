"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSystemResetCapability1729400000000 = void 0;
class PlatformSystemResetCapability1729400000000 {
    name = "PlatformSystemResetCapability1729400000000";
    async up(queryRunner) {
        await queryRunner.query("INSERT OR IGNORE INTO permissions(id, code, description) VALUES(lower(hex(randomblob(16))), 'system.reset', 'Reset tenant and product data while retaining platform administrators')");
        await queryRunner.query(`
      INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId)
      SELECT lower(hex(randomblob(16))), role.id, permission.id
      FROM roles role CROSS JOIN permissions permission
      WHERE role.code = 'PLATFORM_ADMIN' AND permission.code = 'system.reset'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query("DELETE FROM role_permissions WHERE permissionId IN (SELECT id FROM permissions WHERE code = 'system.reset')");
        await queryRunner.query("DELETE FROM permissions WHERE code = 'system.reset'");
    }
}
exports.PlatformSystemResetCapability1729400000000 = PlatformSystemResetCapability1729400000000;
//# sourceMappingURL=1729400000000-PlatformSystemResetCapability.js.map