"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizQuestionBankProvenance1724146900000 = void 0;
class QuizQuestionBankProvenance1724146900000 {
    name = "QuizQuestionBankProvenance1724146900000";
    async up(q) { await q.query(`ALTER TABLE quiz_questions ADD COLUMN questionBankItemId varchar`); await q.query(`CREATE INDEX IDX_quiz_questions_bank_item ON quiz_questions(questionBankItemId)`); }
    async down(q) { await q.query(`DROP INDEX IDX_quiz_questions_bank_item`); }
}
exports.QuizQuestionBankProvenance1724146900000 = QuizQuestionBankProvenance1724146900000;
//# sourceMappingURL=1724146900000-QuizQuestionBankProvenance.js.map