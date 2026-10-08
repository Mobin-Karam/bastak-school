"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentSelfSignup1724143300000 = void 0;
class StudentSelfSignup1724143300000 {
    name = "StudentSelfSignup1724143300000";
    async up(q) {
        await q.query(`ALTER TABLE students ADD COLUMN onboardingStatus varchar(32) NOT NULL DEFAULT ('ASSIGNED')`);
        await q.query(`CREATE INDEX IDX_students_onboarding ON students(onboardingStatus,createdAt)`);
        await q.query(`INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),'student_onboarding.manage','Assign new students to organizations and advisors')`);
        await q.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='PLATFORM_ADMIN' AND p.code='student_onboarding.manage'`);
    }
    async down(q) {
        await q.query(`DROP INDEX IDX_students_onboarding`);
    }
}
exports.StudentSelfSignup1724143300000 = StudentSelfSignup1724143300000;
//# sourceMappingURL=1724143300000-StudentSelfSignup.js.map