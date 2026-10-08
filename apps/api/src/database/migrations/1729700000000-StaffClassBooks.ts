import { MigrationInterface, QueryRunner } from "typeorm";

/** Lets active organization staff curate only textbook shelves, not class records or rosters. */
export class StaffClassBooks1729700000000 implements MigrationInterface {
  name = "StaffClassBooks1729700000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const staffRoles = [
      "ADVISOR",
      "TEACHER",
      "MENTOR",
      "CONTENT_MANAGER",
      "ORGANIZATION_ADMIN",
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "SCHOOL_SUPERVISOR",
      "DISCIPLINARIAN",
      "RELIGIOUS_EDUCATION_MANAGER",
      "GOVERNMENT_EDUCATION_MANAGER",
      "STUDENT_AFFAIRS_MENTOR",
      "COUNSELOR",
    ];
    for (const role of staffRoles) {
      for (const capability of [
        "education.catalog.read",
        "education.catalog.manage",
      ]) {
        await queryRunner.query(
          "INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?",
          [role, capability],
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM role_permissions WHERE permissionId IN (SELECT id FROM permissions WHERE code IN ('education.catalog.read','education.catalog.manage')) AND roleId IN (SELECT id FROM roles WHERE code IN ('ADVISOR','TEACHER','MENTOR','CONTENT_MANAGER','ORGANIZATION_ADMIN','PRINCIPAL','SCHOOL_ADMIN','SCHOOL_SUPERVISOR','DISCIPLINARIAN','RELIGIOUS_EDUCATION_MANAGER','GOVERNMENT_EDUCATION_MANAGER','STUDENT_AFFAIRS_MENTOR','COUNSELOR'))",
    );
  }
}
