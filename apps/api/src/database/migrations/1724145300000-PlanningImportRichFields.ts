import { MigrationInterface, QueryRunner } from "typeorm";

/** Persists fields already present in the planner and rich import payloads. */
export class PlanningImportRichFields1724145300000 implements MigrationInterface {
  name = "PlanningImportRichFields1724145300000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE plans ADD COLUMN title varchar NOT NULL DEFAULT ('برنامه روزانه')`);
    await queryRunner.query(`ALTER TABLE plans ADD COLUMN dayLabel varchar NOT NULL DEFAULT ('')`);
    await queryRunner.query(`ALTER TABLE plans ADD COLUMN persianDate varchar NOT NULL DEFAULT ('')`);
    await queryRunner.query(`ALTER TABLE plans ADD COLUMN jalaliId varchar NOT NULL DEFAULT ('')`);
    await queryRunner.query(`ALTER TABLE plans ADD COLUMN motivationText varchar(600) NOT NULL DEFAULT ('')`);
    await queryRunner.query(`ALTER TABLE tasks ADD COLUMN pages varchar NOT NULL DEFAULT ('')`);
    await queryRunner.query(`ALTER TABLE tasks ADD COLUMN examRef varchar NOT NULL DEFAULT ('')`);
    await queryRunner.query(`ALTER TABLE tasks ADD COLUMN examId varchar NOT NULL DEFAULT ('')`);
    await queryRunner.query(`ALTER TABLE tasks ADD COLUMN conflict boolean NOT NULL DEFAULT (0)`);
    await queryRunner.query(`ALTER TABLE tasks ADD COLUMN conflictGroup varchar NOT NULL DEFAULT ('')`);
    await queryRunner.query(`ALTER TABLE exams ADD COLUMN externalRef varchar NOT NULL DEFAULT ('')`);
    await queryRunner.query(`CREATE INDEX IDX_exams_external_ref ON exams (externalRef)`);
    await queryRunner.query(`ALTER TABLE questions ADD COLUMN sortOrder integer NOT NULL DEFAULT (0)`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP INDEX IDX_exams_external_ref`);
    await queryRunner.query(`ALTER TABLE questions DROP COLUMN sortOrder`);
    await queryRunner.query(`ALTER TABLE exams DROP COLUMN externalRef`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN conflictGroup`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN conflict`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN examId`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN examRef`);
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN pages`);
    await queryRunner.query(`ALTER TABLE plans DROP COLUMN motivationText`);
    await queryRunner.query(`ALTER TABLE plans DROP COLUMN jalaliId`);
    await queryRunner.query(`ALTER TABLE plans DROP COLUMN persianDate`);
    await queryRunner.query(`ALTER TABLE plans DROP COLUMN dayLabel`);
    await queryRunner.query(`ALTER TABLE plans DROP COLUMN title`);
  }
}
