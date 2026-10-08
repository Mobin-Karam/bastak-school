"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleContextHardening1724142200000 = void 0;
class RoleContextHardening1724142200000 {
    name = "RoleContextHardening1724142200000";
    async up(q) {
        await q.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId)
       SELECT lower(hex(randomblob(16))),r.id,p.id
       FROM roles r, permissions p
       WHERE r.code='GUARDIAN' AND p.code='students.read'`);
    }
    async down(q) {
        await q.query(`DELETE FROM role_permissions
       WHERE roleId=(SELECT id FROM roles WHERE code='GUARDIAN')
         AND permissionId=(SELECT id FROM permissions WHERE code='students.read')`);
    }
}
exports.RoleContextHardening1724142200000 = RoleContextHardening1724142200000;
//# sourceMappingURL=1724142200000-RoleContextHardening.js.map