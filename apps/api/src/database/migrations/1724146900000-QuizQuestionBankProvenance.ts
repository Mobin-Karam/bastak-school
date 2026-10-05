import { MigrationInterface, QueryRunner } from "typeorm";
export class QuizQuestionBankProvenance1724146900000 implements MigrationInterface {
  name = "QuizQuestionBankProvenance1724146900000";
  async up(q: QueryRunner) { await q.query(`ALTER TABLE quiz_questions ADD COLUMN questionBankItemId varchar`); await q.query(`CREATE INDEX IDX_quiz_questions_bank_item ON quiz_questions(questionBankItemId)`); }
  async down(q: QueryRunner) { await q.query(`DROP INDEX IDX_quiz_questions_bank_item`); }
}
