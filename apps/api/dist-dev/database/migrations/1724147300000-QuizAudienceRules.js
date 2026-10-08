"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizAudienceRules1724147300000 = void 0;
class QuizAudienceRules1724147300000 {
    name = "QuizAudienceRules1724147300000";
    async up(queryRunner) { await queryRunner.query(`ALTER TABLE quizzes ADD COLUMN audienceRules text NOT NULL DEFAULT ('{"gradeIds":[],"educationTypeIds":[],"trackIds":[]}')`); }
    async down() { }
}
exports.QuizAudienceRules1724147300000 = QuizAudienceRules1724147300000;
//# sourceMappingURL=1724147300000-QuizAudienceRules.js.map