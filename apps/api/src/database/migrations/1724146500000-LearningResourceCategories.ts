import { MigrationInterface, QueryRunner } from "typeorm";

export class LearningResourceCategories1724146500000 implements MigrationInterface {
  name = "LearningResourceCategories1724146500000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE "learning_resources" ADD COLUMN "category" varchar(80) NOT NULL DEFAULT \'عمومی\'');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_learning_resource_category" ON "learning_resources" ("category")');
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_learning_resource_category"');
    await queryRunner.query('ALTER TABLE "learning_resources" DROP COLUMN "category"');
  }
}
