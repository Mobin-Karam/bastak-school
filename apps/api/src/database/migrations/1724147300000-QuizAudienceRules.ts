import { MigrationInterface, QueryRunner } from "typeorm";

export class QuizAudienceRules1724147300000 implements MigrationInterface {
  name = "QuizAudienceRules1724147300000";
  async up(queryRunner: QueryRunner) { await queryRunner.query(`ALTER TABLE quizzes ADD COLUMN audienceRules text NOT NULL DEFAULT ('{"gradeIds":[],"educationTypeIds":[],"trackIds":[]}')`); }
  async down() {}
}
