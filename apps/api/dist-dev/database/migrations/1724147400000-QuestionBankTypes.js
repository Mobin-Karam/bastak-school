"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionBankTypes1724147400000 = void 0;
class QuestionBankTypes1724147400000 {
    name = "QuestionBankTypes1724147400000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE question_bank_items ADD COLUMN bankType varchar NOT NULL DEFAULT ('exam')`);
        await queryRunner.query(`ALTER TABLE question_bank_items ADD COLUMN sourceQuestionBankItemId varchar`);
        await queryRunner.query(`CREATE INDEX IDX_question_bank_items_type ON question_bank_items (bankType)`);
        await queryRunner.query(`CREATE INDEX IDX_question_bank_items_source ON question_bank_items (sourceQuestionBankItemId)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IDX_question_bank_items_source`);
        await queryRunner.query(`DROP INDEX IDX_question_bank_items_type`);
        await queryRunner.query(`ALTER TABLE question_bank_items DROP COLUMN sourceQuestionBankItemId`);
        await queryRunner.query(`ALTER TABLE question_bank_items DROP COLUMN bankType`);
    }
}
exports.QuestionBankTypes1724147400000 = QuestionBankTypes1724147400000;
//# sourceMappingURL=1724147400000-QuestionBankTypes.js.map