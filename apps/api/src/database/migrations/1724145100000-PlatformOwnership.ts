import { MigrationInterface, QueryRunner } from "typeorm";

/** Adds an explicit, transferable owner to installations that already ran bootstrap. */
export class PlatformOwnership1724145100000 implements MigrationInterface {
  name = "PlatformOwnership1724145100000";

  async up(queryRunner: QueryRunner) {
    try {
      await queryRunner.query(`ALTER TABLE users ADD COLUMN isPlatformOwner boolean NOT NULL DEFAULT 0`);
    } catch (error) {
      if (!String(error).includes("duplicate column")) throw error;
    }
    await queryRunner.query(`UPDATE users
      SET isPlatformOwner = 1
      WHERE id = (
        SELECT assignment.userId
        FROM user_role_assignments assignment
        JOIN roles role ON role.id = assignment.roleId
        WHERE role.code = 'PLATFORM_ADMIN'
        ORDER BY assignment.createdAt ASC, assignment.id ASC
        LIMIT 1
      )
      AND NOT EXISTS (SELECT 1 FROM users WHERE isPlatformOwner = 1)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS IDX_users_platform_owner ON users(isPlatformOwner) WHERE isPlatformOwner = 1`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_users_platform_owner`);
  }
}
