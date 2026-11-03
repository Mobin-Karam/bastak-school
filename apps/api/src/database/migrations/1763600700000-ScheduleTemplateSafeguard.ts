import { MigrationInterface, QueryRunner, Table } from "typeorm";

/**
 * Additive migration: existing template snapshots remain readable as legacy
 * unscoped rows. It neither transforms schedule entries nor changes data values.
 */
export class ScheduleTemplateSafeguard1763600700000 implements MigrationInterface {
  name = "ScheduleTemplateSafeguard1763600700000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const templates = await queryRunner.getTable("school_schedule_templates");
    if (templates && !templates.findColumnByName("sourceAcademicYearId")) {
      await queryRunner.query(
        `ALTER TABLE school_schedule_templates ADD COLUMN sourceAcademicYearId varchar(36)`,
      );
      await queryRunner.query(
        `ALTER TABLE school_schedule_templates ADD COLUMN sourceTermId varchar(36)`,
      );
      await queryRunner.query(
        `ALTER TABLE school_schedule_templates ADD COLUMN sourceAcademicYearName varchar(120)`,
      );
      await queryRunner.query(
        `ALTER TABLE school_schedule_templates ADD COLUMN sourceTermName varchar(120)`,
      );
      await queryRunner.query(
        `ALTER TABLE school_schedule_templates ADD COLUMN capturedAt datetime`,
      );
    }
    if (!(await queryRunner.hasTable("schedule_change_safeguards"))) {
      await queryRunner.createTable(
        new Table({
          name: "schedule_change_safeguards",
          columns: [
            { name: "id", type: "varchar", length: "36", isPrimary: true },
            { name: "organizationId", type: "varchar", length: "36" },
            { name: "mode", type: "varchar", length: "20" },
            { name: "reason", type: "varchar", length: "500" },
            {
              name: "activatedById",
              type: "varchar",
              length: "36",
              isNullable: true,
            },
            { name: "activatedAt", type: "datetime" },
            { name: "expiresAt", type: "datetime" },
            {
              name: "createdAt",
              type: "datetime",
              default: "CURRENT_TIMESTAMP",
            },
            {
              name: "updatedAt",
              type: "datetime",
              default: "CURRENT_TIMESTAMP",
            },
          ],
          foreignKeys: [
            {
              columnNames: ["organizationId"],
              referencedTableName: "organizations",
              referencedColumnNames: ["id"],
              onDelete: "CASCADE",
            },
            {
              columnNames: ["activatedById"],
              referencedTableName: "users",
              referencedColumnNames: ["id"],
              onDelete: "SET NULL",
            },
          ],
          indices: [
            {
              name: "IDX_schedule_safeguard_organization",
              columnNames: ["organizationId"],
              isUnique: true,
            },
          ],
        }),
      );
    }
    if (!(await queryRunner.hasTable("schedule_change_safeguard_overrides"))) {
      await queryRunner.createTable(
        new Table({
          name: "schedule_change_safeguard_overrides",
          columns: [
            { name: "id", type: "varchar", length: "36", isPrimary: true },
            { name: "organizationId", type: "varchar", length: "36" },
            { name: "action", type: "varchar", length: "32" },
            { name: "reason", type: "varchar", length: "500" },
            {
              name: "grantedById",
              type: "varchar",
              length: "36",
              isNullable: true,
            },
            { name: "expiresAt", type: "datetime" },
            {
              name: "createdAt",
              type: "datetime",
              default: "CURRENT_TIMESTAMP",
            },
          ],
          foreignKeys: [
            {
              columnNames: ["organizationId"],
              referencedTableName: "organizations",
              referencedColumnNames: ["id"],
              onDelete: "CASCADE",
            },
            {
              columnNames: ["grantedById"],
              referencedTableName: "users",
              referencedColumnNames: ["id"],
              onDelete: "SET NULL",
            },
          ],
          indices: [
            {
              name: "IDX_schedule_safeguard_override",
              columnNames: ["organizationId", "action", "expiresAt"],
            },
          ],
        }),
      );
    }
    await queryRunner.query(
      `INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),'schedule.safeguard.manage','Manage organization-wide schedule change safeguards')`,
    );
    await queryRunner.query(
      `INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code='PRINCIPAL' AND p.code='schedule.safeguard.manage'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("schedule_change_safeguard_overrides"))
      await queryRunner.dropTable("schedule_change_safeguard_overrides");
    if (await queryRunner.hasTable("schedule_change_safeguards"))
      await queryRunner.dropTable("schedule_change_safeguards");
  }
}
