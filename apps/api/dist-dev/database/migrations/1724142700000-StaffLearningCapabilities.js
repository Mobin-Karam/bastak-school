"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffLearningCapabilities1724142700000 = void 0;
const grants = {
    ADVISOR: ["learning.read", "learning.create", "learning.update", "learning.review"],
    TEACHER: ["learning.read"],
    MENTOR: ["learning.read"],
    PLATFORM_ADMIN: ["learning.read", "learning.create", "learning.update", "learning.review"],
};
class StaffLearningCapabilities1724142700000 {
    name = "StaffLearningCapabilities1724142700000";
    async up(q) { for (const [role, capabilities] of Object.entries(grants))
        for (const capability of capabilities)
            await q.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?`, [role, capability]); }
    async down(q) { for (const [role, capabilities] of Object.entries(grants))
        for (const capability of capabilities)
            await q.query(`DELETE FROM role_permissions WHERE roleId=(SELECT id FROM roles WHERE code=?) AND permissionId=(SELECT id FROM permissions WHERE code=?)`, [role, capability]); }
}
exports.StaffLearningCapabilities1724142700000 = StaffLearningCapabilities1724142700000;
//# sourceMappingURL=1724142700000-StaffLearningCapabilities.js.map