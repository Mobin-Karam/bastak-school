import { MigrationInterface, QueryRunner } from "typeorm";

export class IndependentLearnerProfiles1724147500000 implements MigrationInterface {
  name = "IndependentLearnerProfiles1724147500000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      "ALTER TABLE students ADD COLUMN learnerProfile varchar(24) NOT NULL DEFAULT ('school')",
    );
    await queryRunner.query(
      "ALTER TABLE students ADD COLUMN independentType varchar(32)",
    );
    await queryRunner.query(
      "ALTER TABLE students ADD COLUMN learningLevel varchar(120) NOT NULL DEFAULT ('')",
    );
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query("ALTER TABLE students DROP COLUMN learningLevel");
    await queryRunner.query("ALTER TABLE students DROP COLUMN independentType");
    await queryRunner.query("ALTER TABLE students DROP COLUMN learnerProfile");
  }
}
