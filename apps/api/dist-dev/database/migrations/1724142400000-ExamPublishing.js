"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamPublishing1724142400000 = void 0;
class ExamPublishing1724142400000 {
    name = "ExamPublishing1724142400000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "exams" ADD COLUMN "published" boolean NOT NULL DEFAULT (0)`);
        await queryRunner.query(`UPDATE "exams" SET "published" = 1`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "published"`);
    }
}
exports.ExamPublishing1724142400000 = ExamPublishing1724142400000;
//# sourceMappingURL=1724142400000-ExamPublishing.js.map