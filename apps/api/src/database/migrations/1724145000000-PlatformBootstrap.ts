import { MigrationInterface, QueryRunner } from "typeorm";

export class PlatformBootstrap1724145000000 implements MigrationInterface {
  name = "PlatformBootstrap1724145000000";

  async up(queryRunner: QueryRunner) {
    try {
      await queryRunner.query(`ALTER TABLE users ADD COLUMN email varchar(254)`);
    } catch (error) {
      if (!String(error).includes("duplicate column")) throw error;
    }
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS IDX_users_email ON users(email) WHERE email IS NOT NULL`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_users_email`);
  }
}
