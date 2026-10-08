"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizAssignments1724147000000 = void 0;
class QuizAssignments1724147000000 {
    name = "QuizAssignments1724147000000";
    async up(q) { await q.query(`CREATE TABLE quiz_assignments (id varchar PRIMARY KEY NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), quizId varchar NOT NULL, studentId varchar NOT NULL, CONSTRAINT UQ_quiz_assignment UNIQUE (quizId,studentId), CONSTRAINT FK_quiz_assignment_quiz FOREIGN KEY (quizId) REFERENCES quizzes(id) ON DELETE CASCADE, CONSTRAINT FK_quiz_assignment_student FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE)`); await q.query(`CREATE INDEX IDX_quiz_assignment_student ON quiz_assignments(studentId)`); }
    async down(q) { await q.query(`DROP TABLE quiz_assignments`); }
}
exports.QuizAssignments1724147000000 = QuizAssignments1724147000000;
//# sourceMappingURL=1724147000000-QuizAssignments.js.map