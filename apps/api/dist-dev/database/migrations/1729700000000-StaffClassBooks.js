"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffClassBooks1729700000000 = void 0;
class StaffClassBooks1729700000000 {
    name = "StaffClassBooks1729700000000";
    async up(queryRunner) {
        const staffRoles = [
            "ADVISOR",
            "TEACHER",
            "MENTOR",
            "CONTENT_MANAGER",
            "ORGANIZATION_ADMIN",
            "PRINCIPAL",
            "SCHOOL_ADMIN",
            "SCHOOL_SUPERVISOR",
            "DISCIPLINARIAN",
            "RELIGIOUS_EDUCATION_MANAGER",
            "GOVERNMENT_EDUCATION_MANAGER",
            "STUDENT_AFFAIRS_MENTOR",
            "COUNSELOR",
        ];
        for (const role of staffRoles) {
            for (const capability of [
                "education.catalog.read",
                "education.catalog.manage",
            ]) {
                await queryRunner.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?", [role, capability]);
            }
        }
    }
    async down(queryRunner) {
        await queryRunner.query("DELETE FROM role_permissions WHERE permissionId IN (SELECT id FROM permissions WHERE code IN ('education.catalog.read','education.catalog.manage')) AND roleId IN (SELECT id FROM roles WHERE code IN ('ADVISOR','TEACHER','MENTOR','CONTENT_MANAGER','ORGANIZATION_ADMIN','PRINCIPAL','SCHOOL_ADMIN','SCHOOL_SUPERVISOR','DISCIPLINARIAN','RELIGIOUS_EDUCATION_MANAGER','GOVERNMENT_EDUCATION_MANAGER','STUDENT_AFFAIRS_MENTOR','COUNSELOR'))");
    }
}
exports.StaffClassBooks1729700000000 = StaffClassBooks1729700000000;
//# sourceMappingURL=1729700000000-StaffClassBooks.js.map