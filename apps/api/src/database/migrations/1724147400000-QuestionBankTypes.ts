import { MigrationInterface, QueryRunner } from "typeorm";

export class QuestionBankTypes1724147400000 implements MigrationInterface {
  name = "QuestionBankTypes1724147400000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE question_bank_items ADD COLUMN bankType varchar NOT NULL DEFAULT ('exam')`);
    await queryRunner.query(`ALTER TABLE question_bank_items ADD COLUMN sourceQuestionBankItemId varchar`);
    await queryRunner.query(`CREATE INDEX IDX_question_bank_items_type ON question_bank_items (bankType)`);
    await queryRunner.query(`CREATE INDEX IDX_question_bank_items_source ON question_bank_items (sourceQuestionBankItemId)`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP INDEX IDX_question_bank_items_source`);
    await queryRunner.query(`DROP INDEX IDX_question_bank_items_type`);
    await queryRunner.query(`ALTER TABLE question_bank_items DROP COLUMN sourceQuestionBankItemId`);
    await queryRunner.query(`ALTER TABLE question_bank_items DROP COLUMN bankType`);
  }
}
