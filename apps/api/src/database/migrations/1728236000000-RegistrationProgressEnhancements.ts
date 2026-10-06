import { MigrationInterface, QueryRunner } from "typeorm";

export class RegistrationProgressEnhancements1728236000000 implements MigrationInterface {
  name = "RegistrationProgressEnhancements1728236000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    // Add verification fields to registration_progress table one at a time (better-sqlite3 doesn't support multiple ADD COLUMN)
    await queryRunner.query(`ALTER TABLE registration_progress ADD COLUMN verifiedById varchar NULL`);
    await queryRunner.query(`ALTER TABLE registration_progress ADD COLUMN verifiedAt datetime NULL`);
    await queryRunner.query(`ALTER TABLE registration_progress ADD COLUMN rejectionNote text NULL`);

    // Add foreign key constraint - better-sqlite3 doesn't support ALTER TABLE ADD CONSTRAINT, so we'll handle this in the entity definition instead
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Remove verification fields
    await queryRunner.query(`
      ALTER TABLE registration_progress 
      DROP COLUMN verifiedById,
      DROP COLUMN verifiedAt,
      DROP COLUMN rejectionNote
    `);
  }
}
