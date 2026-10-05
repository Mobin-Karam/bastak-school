import { MigrationInterface, QueryRunner } from "typeorm";

export class EducationSharingAuditScope1724145500000
  implements MigrationInterface
{
  name = "EducationSharingAuditScope1724145500000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE audit_logs ADD COLUMN organizationId varchar",
    ).catch((error) => {
      if (!String(error).includes("duplicate column")) throw error;
    });
    await queryRunner.query(
      "CREATE INDEX IF NOT EXISTS IDX_audit_logs_organization ON audit_logs(organizationId)",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DROP INDEX IF EXISTS IDX_audit_logs_organization",
    );
  }
}
