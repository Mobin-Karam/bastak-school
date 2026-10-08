"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolRoles1728233600000 = void 0;
class SchoolRoles1728233600000 {
    name = "SchoolRoles1728233600000";
    async up(queryRunner) {
        const roles = [
            { code: "SCHOOL_ADMIN", name: "مدیریت", organizationScoped: true },
            { code: "SCHOOL_SUPERVISOR", name: "ناظم", organizationScoped: true },
            { code: "COUNSELOR", name: "مشاور", organizationScoped: true },
            { code: "RELIGIOUS_EDUCATION_MANAGER", name: "مسئول آموزش دینی", organizationScoped: true },
            { code: "GOVERNMENT_EDUCATION_MANAGER", name: "مسئول آموزش دولتی", organizationScoped: true },
            { code: "STUDENT_AFFAIRS_MENTOR", name: "مربی تربیتی", organizationScoped: true },
            { code: "TEACHER", name: "اساتید", organizationScoped: true },
            { code: "STUDENT", name: "طلبه", organizationScoped: false },
            { code: "GUARDIAN", name: "اولیاء", organizationScoped: false },
        ];
        for (const role of roles) {
            await queryRunner.query(`INSERT OR IGNORE INTO roles(id, code, name, organizationScoped) VALUES(lower(hex(randomblob(16))), ?, ?, ?)`, [role.code, role.name, role.organizationScoped ? 1 : 0]);
        }
        const capabilities = [
            "students.read.all",
            "students.create",
            "students.update",
            "students.delete",
            "students.import",
            "students.export",
            "registration.read",
            "registration.manage",
            "registration.review",
            "registration.approve",
            "attendance.read",
            "attendance.manage",
            "attendance.class.manage",
            "attendance.group.manage",
            "attendance.dorm.manage",
            "attendance.night.manage",
            "classes.read",
            "classes.manage",
            "groups.read",
            "groups.manage",
            "dorms.read",
            "dorms.manage",
            "relationships.read",
            "relationships.manage",
            "documents.read",
            "documents.manage",
            "school.settings.manage",
            "users.manage",
            "roles.manage",
            "students.read.all",
            "students.update",
            "students.import",
            "students.export",
            "registration.read",
            "registration.review",
            "attendance.read",
            "attendance.manage",
            "attendance.class.manage",
            "attendance.group.manage",
            "attendance.dorm.manage",
            "attendance.night.manage",
            "classes.read",
            "classes.manage",
            "groups.read",
            "groups.manage",
            "dorms.read",
            "dorms.manage",
            "documents.read",
            "students.read.assigned",
            "relationships.read",
            "relationships.manage",
            "attendance.read",
            "students.read",
            "classes.read",
            "classes.manage",
            "classes.roster.manage",
            "groups.read",
            "groups.manage",
            "attendance.read",
            "attendance.manage",
            "attendance.class.read",
            "attendance.class.manage",
            "attendance.group.read",
            "attendance.group.manage",
            "students.read",
            "classes.read",
            "classes.manage",
            "classes.roster.manage",
            "groups.read",
            "groups.manage",
            "attendance.read",
            "attendance.manage",
            "attendance.class.read",
            "attendance.class.manage",
            "attendance.group.read",
            "attendance.group.manage",
            "students.read.assigned",
            "student.profile.read",
            "relationships.read",
            "attendance.read",
            "attendance.dorm.read",
            "students.read.assigned",
            "classes.read",
            "groups.read",
            "attendance.read",
            "attendance.class.read",
            "attendance.class.manage",
            "attendance.group.read",
            "attendance.group.manage",
            "student.self.read",
            "student.self.update",
            "registration.self.read",
            "registration.self.update",
            "documents.self.upload",
            "students.read.linked",
            "attendance.linked.read",
        ];
        for (const capability of capabilities) {
            await queryRunner.query(`INSERT OR IGNORE INTO permissions(id, code, description) VALUES(lower(hex(randomblob(16))), ?, '')`, [capability]);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`DELETE FROM roles WHERE code IN ('SCHOOL_ADMIN', 'SCHOOL_SUPERVISOR', 'COUNSELOR', 'RELIGIOUS_EDUCATION_MANAGER', 'GOVERNMENT_EDUCATION_MANAGER', 'STUDENT_AFFAIRS_MENTOR', 'TEACHER', 'STUDENT', 'GUARDIAN')`);
        const capabilities = [
            "students.read.all", "students.create", "students.update", "students.delete", "students.import", "students.export",
            "registration.read", "registration.manage", "registration.review", "registration.approve",
            "attendance.read", "attendance.manage", "attendance.class.manage", "attendance.group.manage", "attendance.dorm.manage", "attendance.night.manage",
            "classes.read", "classes.manage", "groups.read", "groups.manage", "dorms.read", "dorms.manage",
            "relationships.read", "relationships.manage", "documents.read", "documents.manage",
            "school.settings.manage", "users.manage", "roles.manage",
            "students.read.assigned", "student.profile.read", "students.read.linked", "attendance.linked.read",
            "student.self.read", "student.self.update", "registration.self.read", "registration.self.update", "documents.self.upload",
            "attendance.class.read", "attendance.class.manage", "attendance.group.read", "attendance.group.manage",
            "attendance.dorm.read",
        ];
        for (const capability of capabilities) {
            await queryRunner.query(`DELETE FROM permissions WHERE code = ?`, [capability]);
        }
    }
}
exports.SchoolRoles1728233600000 = SchoolRoles1728233600000;
//# sourceMappingURL=1728233600000-SchoolRoles.js.map