import { MigrationInterface, QueryRunner } from "typeorm";

export class SubjectCategories1724146400000 implements MigrationInterface {
  name = "SubjectCategories1724146400000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query('ALTER TABLE "subjects" ADD COLUMN "category" varchar(80) NOT NULL DEFAULT \'عمومی\'');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_subject_category" ON "subjects" ("category")');
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_subject_category"');
    await queryRunner.query('ALTER TABLE "subjects" DROP COLUMN "category"');
  }
}
