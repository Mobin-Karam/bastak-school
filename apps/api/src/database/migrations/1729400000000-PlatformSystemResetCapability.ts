import { MigrationInterface, QueryRunner } from "typeorm";

export class PlatformSystemResetCapability1729400000000 implements MigrationInterface {
  name = "PlatformSystemResetCapability1729400000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "INSERT OR IGNORE INTO permissions(id, code, description) VALUES(lower(hex(randomblob(16))), 'system.reset', 'Reset tenant and product data while retaining platform administrators')",
    );
    await queryRunner.query(`
      INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId)
      SELECT lower(hex(randomblob(16))), role.id, permission.id
      FROM roles role CROSS JOIN permissions permission
      WHERE role.code = 'PLATFORM_ADMIN' AND permission.code = 'system.reset'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM role_permissions WHERE permissionId IN (SELECT id FROM permissions WHERE code = 'system.reset')",
    );
    await queryRunner.query(
      "DELETE FROM permissions WHERE code = 'system.reset'",
    );
  }
}
