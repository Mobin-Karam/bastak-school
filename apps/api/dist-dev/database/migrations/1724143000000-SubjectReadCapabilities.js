"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectReadCapabilities1724143000000 = void 0;
class SubjectReadCapabilities1724143000000 {
    name = "SubjectReadCapabilities1724143000000";
    async up(queryRunner) {
        for (const role of ["ORGANIZATION_ADMIN", "PLATFORM_ADMIN"])
            await queryRunner.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId)
         SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p
         WHERE r.code=? AND p.code='subjects.read'`, [role]);
    }
    async down(queryRunner) {
        await queryRunner.query(`DELETE FROM role_permissions WHERE roleId IN (SELECT id FROM roles WHERE code IN ('ORGANIZATION_ADMIN','PLATFORM_ADMIN')) AND permissionId=(SELECT id FROM permissions WHERE code='subjects.read')`);
    }
}
exports.SubjectReadCapabilities1724143000000 = SubjectReadCapabilities1724143000000;
//# sourceMappingURL=1724143000000-SubjectReadCapabilities.js.map