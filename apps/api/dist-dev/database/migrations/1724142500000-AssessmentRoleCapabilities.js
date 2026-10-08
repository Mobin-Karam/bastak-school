"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentRoleCapabilities1724142500000 = void 0;
const grants = {
    ADVISOR: ["retry_requests.read", "retry_requests.moderate"],
    TEACHER: ["syllabus.manage", "retry_requests.read", "quizzes.read", "quizzes.create", "quizzes.update", "quiz_questions.manage"],
    CONTENT_MANAGER: ["syllabus.manage", "quizzes.read", "quizzes.create", "quizzes.update", "quiz_questions.manage"],
};
class AssessmentRoleCapabilities1724142500000 {
    name = "AssessmentRoleCapabilities1724142500000";
    async up(queryRunner) {
        for (const [role, capabilities] of Object.entries(grants)) {
            for (const capability of capabilities) {
                await queryRunner.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId)
           SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p
           WHERE r.code=? AND p.code=?`, [role, capability]);
            }
        }
    }
    async down(queryRunner) {
        for (const [role, capabilities] of Object.entries(grants)) {
            for (const capability of capabilities) {
                await queryRunner.query(`DELETE FROM role_permissions WHERE roleId=(SELECT id FROM roles WHERE code=?) AND permissionId=(SELECT id FROM permissions WHERE code=?)`, [role, capability]);
            }
        }
    }
}
exports.AssessmentRoleCapabilities1724142500000 = AssessmentRoleCapabilities1724142500000;
//# sourceMappingURL=1724142500000-AssessmentRoleCapabilities.js.map