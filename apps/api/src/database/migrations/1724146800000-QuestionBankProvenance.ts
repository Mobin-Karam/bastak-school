import { MigrationInterface, QueryRunner } from "typeorm";

export class QuestionBankProvenance1724146800000 implements MigrationInterface {
  name = "QuestionBankProvenance1724146800000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE questions ADD COLUMN questionBankItemId varchar`);
    await queryRunner.query(`CREATE INDEX IDX_questions_bank_item ON questions(questionBankItemId)`);
  }
  async down(queryRunner: QueryRunner) { await queryRunner.query(`DROP INDEX IDX_questions_bank_item`); }
}
