import { MigrationInterface, QueryRunner } from "typeorm";

export class StudentPresenceSyncStatus1724145200000 implements MigrationInterface {
  name = "StudentPresenceSyncStatus1724145200000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query("ALTER TABLE student_presence ADD COLUMN syncStatus varchar(16) NOT NULL DEFAULT ('online')");
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query("ALTER TABLE student_presence DROP COLUMN syncStatus");
  }
}
