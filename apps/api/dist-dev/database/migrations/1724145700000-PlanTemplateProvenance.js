"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanTemplateProvenance1724145700000 = void 0;
class PlanTemplateProvenance1724145700000 {
    name = "PlanTemplateProvenance1724145700000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE plans ADD COLUMN templateId varchar");
        await queryRunner.query("ALTER TABLE plans ADD COLUMN templateVersion integer");
        await queryRunner.query("CREATE INDEX IF NOT EXISTS IDX_plans_templateId ON plans (templateId)");
    }
    async down(queryRunner) {
        await queryRunner.query("DROP INDEX IF EXISTS IDX_plans_templateId");
        await queryRunner.query("ALTER TABLE plans DROP COLUMN templateVersion");
        await queryRunner.query("ALTER TABLE plans DROP COLUMN templateId");
    }
}
exports.PlanTemplateProvenance1724145700000 = PlanTemplateProvenance1724145700000;
//# sourceMappingURL=1724145700000-PlanTemplateProvenance.js.map