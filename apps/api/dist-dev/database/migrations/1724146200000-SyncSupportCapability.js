"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncSupportCapability1724146200000 = void 0;
class SyncSupportCapability1724146200000 {
    name = "SyncSupportCapability1724146200000";
    async up(q) { await q.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),'student.sync.support','Review student sync health')"); for (const role of ['ADVISOR', 'ORGANIZATION_ADMIN', 'PLATFORM_ADMIN'])
        await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code='student.sync.support'", [role]); }
    async down() { }
}
exports.SyncSupportCapability1724146200000 = SyncSupportCapability1724146200000;
//# sourceMappingURL=1724146200000-SyncSupportCapability.js.map