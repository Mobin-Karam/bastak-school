import { MigrationInterface, QueryRunner } from "typeorm";

export class StudentAccountChangeLimits1731800300000 implements MigrationInterface {
  name = "StudentAccountChangeLimits1731800300000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE users ADD COLUMN passwordChangeCount integer NOT NULL DEFAULT 0",
    );
    await queryRunner.query(
      "ALTER TABLE account_change_requests ADD COLUMN requestedSecretHash varchar(255)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE account_change_requests DROP COLUMN requestedSecretHash",
    );
    await queryRunner.query(
      "ALTER TABLE users DROP COLUMN passwordChangeCount",
    );
  }
}
