"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolWorkflowCapabilityGrants1728300000000 = void 0;
class SchoolWorkflowCapabilityGrants1728300000000 {
    name = "SchoolWorkflowCapabilityGrants1728300000000";
    async up(q) {
        const mapping = {
            PRINCIPAL: ["attendance.read", "attendance.manage", "leave.read", "leave.manage", "exit.read", "exit.manage", "principal.permissions.manage"],
            ORGANIZATION_ADMIN: ["attendance.read", "attendance.manage", "leave.read", "leave.manage", "exit.read", "exit.manage", "principal.permissions.manage"],
            DISCIPLINARIAN: ["attendance.read", "attendance.manage", "leave.read", "leave.manage", "exit.read", "exit.manage"],
            RELIGIOUS_EDUCATION_MANAGER: ["attendance.read", "attendance.manage"],
            GOVERNMENT_EDUCATION_MANAGER: ["attendance.read", "attendance.manage"],
            STUDENT_AFFAIRS_MENTOR: ["attendance.read"],
            TEACHER: ["attendance.read", "attendance.manage"],
            STUDENT: ["leave.read", "leave.manage", "exit.read", "exit.manage"],
        };
        for (const capability of new Set(Object.values(mapping).flat()))
            await q.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'')", [capability]);
        for (const [role, capabilities] of Object.entries(mapping))
            for (const capability of capabilities)
                await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?", [role, capability]);
    }
    async down(q) {
    }
}
exports.SchoolWorkflowCapabilityGrants1728300000000 = SchoolWorkflowCapabilityGrants1728300000000;
//# sourceMappingURL=1728300000000-SchoolWorkflowCapabilityGrants.js.map