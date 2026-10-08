"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformAdminChat1724143500000 = void 0;
class PlatformAdminChat1724143500000 {
    name = "PlatformAdminChat1724143500000";
    async up(queryRunner) {
        for (const permission of [
            "chat.read",
            "chat.send",
            "chat.group.create",
            "chat.group.manage",
            "chat.moderate",
        ]) {
            await queryRunner.query(`INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId)
         SELECT lower(hex(randomblob(16))), role.id, permission.id
         FROM roles role, permissions permission
         WHERE role.code = 'PLATFORM_ADMIN' AND permission.code = ?`, [permission]);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`DELETE FROM role_permissions
       WHERE roleId = (SELECT id FROM roles WHERE code = 'PLATFORM_ADMIN')
         AND permissionId IN (
           SELECT id FROM permissions
           WHERE code IN ('chat.read', 'chat.send', 'chat.group.create', 'chat.group.manage', 'chat.moderate')
         )`);
    }
}
exports.PlatformAdminChat1724143500000 = PlatformAdminChat1724143500000;
//# sourceMappingURL=1724143500000-PlatformAdminChat.js.map