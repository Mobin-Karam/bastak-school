"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionBankProvenance1724146800000 = void 0;
class QuestionBankProvenance1724146800000 {
    name = "QuestionBankProvenance1724146800000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE questions ADD COLUMN questionBankItemId varchar`);
        await queryRunner.query(`CREATE INDEX IDX_questions_bank_item ON questions(questionBankItemId)`);
    }
    async down(queryRunner) { await queryRunner.query(`DROP INDEX IDX_questions_bank_item`); }
}
exports.QuestionBankProvenance1724146800000 = QuestionBankProvenance1724146800000;
//# sourceMappingURL=1724146800000-QuestionBankProvenance.js.map