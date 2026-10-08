"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizDeliveryPolicy1724147100000 = void 0;
class QuizDeliveryPolicy1724147100000 {
    name = "QuizDeliveryPolicy1724147100000";
    async up(q) { await q.query(`ALTER TABLE quizzes ADD COLUMN attemptLimit integer NOT NULL DEFAULT (1)`); await q.query(`ALTER TABLE quizzes ADD COLUMN openAt datetime`); await q.query(`ALTER TABLE quizzes ADD COLUMN closeAt datetime`); await q.query(`ALTER TABLE quizzes ADD COLUMN resultPolicy varchar NOT NULL DEFAULT ('immediate')`); await q.query(`ALTER TABLE quizzes ADD COLUMN resultsReleasedAt datetime`); }
    async down() { }
}
exports.QuizDeliveryPolicy1724147100000 = QuizDeliveryPolicy1724147100000;
//# sourceMappingURL=1724147100000-QuizDeliveryPolicy.js.map