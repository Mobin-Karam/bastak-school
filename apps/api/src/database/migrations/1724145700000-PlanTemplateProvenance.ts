import { MigrationInterface, QueryRunner } from "typeorm";

/** Keeps a delivered plan traceable to the immutable template revision that created it. */
export class PlanTemplateProvenance1724145700000 implements MigrationInterface {
  name = "PlanTemplateProvenance1724145700000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE plans ADD COLUMN templateId varchar");
    await queryRunner.query("ALTER TABLE plans ADD COLUMN templateVersion integer");
    await queryRunner.query("CREATE INDEX IF NOT EXISTS IDX_plans_templateId ON plans (templateId)");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP INDEX IF EXISTS IDX_plans_templateId");
    await queryRunner.query("ALTER TABLE plans DROP COLUMN templateVersion");
    await queryRunner.query("ALTER TABLE plans DROP COLUMN templateId");
  }
}
