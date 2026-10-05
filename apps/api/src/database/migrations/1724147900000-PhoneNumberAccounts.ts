import { MigrationInterface, QueryRunner } from "typeorm";

export class PhoneNumberAccounts1724147900000 implements MigrationInterface {
  name = "PhoneNumberAccounts1724147900000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`ALTER TABLE users ADD COLUMN phoneNumber varchar(11)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IDX_users_phoneNumber ON users (phoneNumber)`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP INDEX IDX_users_phoneNumber`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN phoneNumber`);
  }
}
