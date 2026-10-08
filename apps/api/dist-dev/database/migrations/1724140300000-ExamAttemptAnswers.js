"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamAttemptAnswers1724140300000 = void 0;
class ExamAttemptAnswers1724140300000 {
    name = "ExamAttemptAnswers1724140300000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE exam_attempts ADD COLUMN answers text NOT NULL DEFAULT ('[]')`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE exam_attempts DROP COLUMN answers`);
    }
}
exports.ExamAttemptAnswers1724140300000 = ExamAttemptAnswers1724140300000;
//# sourceMappingURL=1724140300000-ExamAttemptAnswers.js.map