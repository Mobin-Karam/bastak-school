"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningResourceCategories1724146500000 = void 0;
class LearningResourceCategories1724146500000 {
    name = "LearningResourceCategories1724146500000";
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE "learning_resources" ADD COLUMN "category" varchar(80) NOT NULL DEFAULT \'عمومی\'');
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_learning_resource_category" ON "learning_resources" ("category")');
    }
    async down(queryRunner) {
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_learning_resource_category"');
        await queryRunner.query('ALTER TABLE "learning_resources" DROP COLUMN "category"');
    }
}
exports.LearningResourceCategories1724146500000 = LearningResourceCategories1724146500000;
//# sourceMappingURL=1724146500000-LearningResourceCategories.js.map