"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupervisorSchoolOperations1728600000000 = void 0;
class SupervisorSchoolOperations1728600000000 {
    name = "SupervisorSchoolOperations1728600000000";
    async up(queryRunner) {
        const capabilities = [
            "students.read",
            "classes.read",
            "classes.manage",
            "classes.roster.manage",
            "schedule.read",
            "attendance.read",
            "attendance.manage",
            "prayer_times.read",
            "prayer_times.manage",
            "announcements.read",
            "announcements.manage",
        ];
        for (const capability of capabilities) {
            await queryRunner.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'School supervisor operation')", [capability]);
            await queryRunner.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='SCHOOL_SUPERVISOR' AND p.code=?", [capability]);
        }
    }
    async down() {
    }
}
exports.SupervisorSchoolOperations1728600000000 = SupervisorSchoolOperations1728600000000;
//# sourceMappingURL=1728600000000-SupervisorSchoolOperations.js.map