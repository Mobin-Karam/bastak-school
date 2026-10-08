"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamAudienceRules1724147600000 = void 0;
class ExamAudienceRules1724147600000 {
    name = "ExamAudienceRules1724147600000";
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE exams ADD COLUMN audienceRules text NOT NULL DEFAULT (\'{"gradeIds":[],"educationTypeIds":[],"trackIds":[],"learnerProfiles":[],"independentTypes":[]}\')');
        await queryRunner.query("CREATE TABLE exam_class_assignments (id varchar PRIMARY KEY NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), examId varchar NOT NULL, classroomId varchar NOT NULL, CONSTRAINT UQ_exam_class_assignment UNIQUE (examId, classroomId), CONSTRAINT FK_exam_class_assignment_exam FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE, CONSTRAINT FK_exam_class_assignment_class FOREIGN KEY (classroomId) REFERENCES education_classes(id) ON DELETE CASCADE)");
    }
    async down(queryRunner) {
        await queryRunner.query("DROP TABLE exam_class_assignments");
        await queryRunner.query("ALTER TABLE exams DROP COLUMN audienceRules");
    }
}
exports.ExamAudienceRules1724147600000 = ExamAudienceRules1724147600000;
//# sourceMappingURL=1724147600000-ExamAudienceRules.js.map