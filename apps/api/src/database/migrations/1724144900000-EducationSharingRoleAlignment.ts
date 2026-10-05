import { MigrationInterface, QueryRunner } from "typeorm";

export class EducationSharingRoleAlignment1724144900000 implements MigrationInterface {
  name = "EducationSharingRoleAlignment1724144900000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      INSERT OR IGNORE INTO role_permissions(id, roleId, permissionId)
      SELECT lower(hex(randomblob(16))), roles.id, permissions.id
      FROM roles
      CROSS JOIN permissions
      WHERE roles.code = 'CONTENT_MANAGER'
        AND permissions.code = 'education.share'
    `);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`
      DELETE FROM role_permissions
      WHERE roleId = (SELECT id FROM roles WHERE code = 'CONTENT_MANAGER')
        AND permissionId = (SELECT id FROM permissions WHERE code = 'education.share')
    `);
  }
}
