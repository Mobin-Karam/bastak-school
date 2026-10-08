"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizClassAssignments1724147200000 = void 0;
class QuizClassAssignments1724147200000 {
    name = "QuizClassAssignments1724147200000";
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE quiz_class_assignments (id varchar PRIMARY KEY NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), quizId varchar NOT NULL, classroomId varchar NOT NULL, CONSTRAINT UQ_quiz_class_assignment UNIQUE (quizId, classroomId), CONSTRAINT FK_quiz_class_assignment_quiz FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE, CONSTRAINT FK_quiz_class_assignment_classroom FOREIGN KEY (classroomId) REFERENCES education_classes(id) ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE INDEX IDX_quiz_class_assignment_classroom ON quiz_class_assignments(classroomId)`);
    }
    async down(queryRunner) { await queryRunner.query(`DROP TABLE quiz_class_assignments`); }
}
exports.QuizClassAssignments1724147200000 = QuizClassAssignments1724147200000;
//# sourceMappingURL=1724147200000-QuizClassAssignments.js.map