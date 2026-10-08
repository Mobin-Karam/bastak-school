"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectCategories1724146400000 = void 0;
class SubjectCategories1724146400000 {
    name = "SubjectCategories1724146400000";
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE "subjects" ADD COLUMN "category" varchar(80) NOT NULL DEFAULT \'عمومی\'');
        await queryRunner.query('CREATE INDEX IF NOT EXISTS "IDX_subject_category" ON "subjects" ("category")');
    }
    async down(queryRunner) {
        await queryRunner.query('DROP INDEX IF EXISTS "IDX_subject_category"');
        await queryRunner.query('ALTER TABLE "subjects" DROP COLUMN "category"');
    }
}
exports.SubjectCategories1724146400000 = SubjectCategories1724146400000;
//# sourceMappingURL=1724146400000-SubjectCategories.js.map