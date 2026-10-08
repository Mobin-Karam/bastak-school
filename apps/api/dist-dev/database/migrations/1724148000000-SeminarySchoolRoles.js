"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeminarySchoolRoles1724148000000 = void 0;
const roles = [
    ["PRINCIPAL", "School principal", ["organization.read", "organization.manage", "organization.members.manage", "users.read", "users.manage", "students.read", "students.create", "students.update", "students.archive", "reports.read", "attendance.manage.all", "leave.approve.manager", "dormitory.manage.rooms"]],
    ["DISCIPLINARIAN", "Disciplinarian", ["students.read", "attendance.view.class", "attendance.manage.class", "leave.approve.supervisor", "dormitory.view.own", "reports.read", "chat.read", "chat.send"]],
    ["RELIGIOUS_EDUCATION_MANAGER", "Religious education manager", ["students.read", "classes.read", "subjects.read", "exams.read", "exams.create", "exams.update", "exams.assign", "exams.results.read", "attendance.view.class", "attendance.manage.class", "chat.read", "chat.send"]],
    ["GOVERNMENT_EDUCATION_MANAGER", "Government education manager", ["students.read", "classes.read", "subjects.read", "exams.read", "exams.create", "exams.update", "exams.assign", "exams.results.read", "attendance.view.class", "attendance.manage.class", "chat.read", "chat.send"]],
    ["STUDENT_AFFAIRS_MENTOR", "Student affairs mentor", ["students.read", "student.profile.read", "attendance.view.class", "dormitory.view.own", "leave.approve.supervisor", "chat.read", "chat.send", "reports.read"]],
    ["COUNSELOR", "Counselor", ["students.read", "student.profile.read", "student.progress.read", "counseling.view.assigned_students", "counseling.manage.assigned_students", "chat.read", "chat.send", "reports.read"]],
];
class SeminarySchoolRoles1724148000000 {
    name = "SeminarySchoolRoles1724148000000";
    async up(queryRunner) {
        for (const [code, name, capabilities] of roles) {
            await queryRunner.query(`INSERT OR IGNORE INTO roles(id, code, name, organizationScoped) VALUES(lower(hex(randomblob(16))), ?, ?, 1)`, [code, name]);
            for (const capability of capabilities) {
                await queryRunner.query(`INSERT OR IGNORE INTO permissions(id, code, description) VALUES(lower(hex(randomblob(16))), ?, '')`, [capability]);
                await queryRunner.query(`INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId) SELECT lower(hex(randomblob(16))), r.id, p.id FROM roles r, permissions p WHERE r.code=? AND p.code=?`, [code, capability]);
            }
        }
    }
    async down(queryRunner) {
        for (const [code] of roles) {
            await queryRunner.query(`DELETE FROM role_permissions WHERE roleId IN (SELECT id FROM roles WHERE code=?)`, [code]);
            await queryRunner.query(`DELETE FROM roles WHERE code=?`, [code]);
        }
    }
}
exports.SeminarySchoolRoles1724148000000 = SeminarySchoolRoles1724148000000;
//# sourceMappingURL=1724148000000-SeminarySchoolRoles.js.map