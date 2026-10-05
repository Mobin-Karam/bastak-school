import { MigrationInterface, QueryRunner } from "typeorm";

export class StudentSignupPolicies1724147800000 implements MigrationInterface {
  name = "StudentSignupPolicies1724147800000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(
      `CREATE TABLE platform_enrollment_settings (
        id integer PRIMARY KEY NOT NULL CHECK (id = 1),
        publicStudentSignupEnabled boolean NOT NULL DEFAULT 0,
        updatedAt datetime NOT NULL DEFAULT (datetime('now'))
      )`,
    );
    await queryRunner.query(
      `INSERT INTO platform_enrollment_settings (id, publicStudentSignupEnabled) VALUES (1, 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE organizations ADD COLUMN studentSignupManagedByOrganization boolean NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE organizations ADD COLUMN studentSignupEnabled boolean NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE organizations ADD COLUMN studentSignupLimit integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE organizations ADD COLUMN studentSignupCount integer NOT NULL DEFAULT 0`,
    );
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE platform_enrollment_settings`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN studentSignupCount`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN studentSignupLimit`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN studentSignupEnabled`);
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN studentSignupManagedByOrganization`);
  }
}
