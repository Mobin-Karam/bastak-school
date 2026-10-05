import { MigrationInterface, QueryRunner } from "typeorm";

export class OrganizationFeatureEntitlements1724147700000 implements MigrationInterface {
  name = "OrganizationFeatureEntitlements1724147700000";
  async up(queryRunner: QueryRunner) {
    await queryRunner.query("ALTER TABLE organizations ADD COLUMN disabledFeatures text NOT NULL DEFAULT ('[]')");
  }
  async down(queryRunner: QueryRunner) {
    await queryRunner.query("ALTER TABLE organizations DROP COLUMN disabledFeatures");
  }
}
