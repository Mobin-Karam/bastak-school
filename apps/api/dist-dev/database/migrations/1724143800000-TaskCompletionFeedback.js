"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCompletionFeedback1724143800000 = void 0;
class TaskCompletionFeedback1724143800000 {
    async up(q) {
        await q.query(`ALTER TABLE tasks ADD COLUMN actualMinutes integer NOT NULL DEFAULT (0)`);
        await q.query(`ALTER TABLE tasks ADD COLUMN actualTests integer NOT NULL DEFAULT (0)`);
        await q.query(`ALTER TABLE tasks ADD COLUMN completionDifficulty varchar NOT NULL DEFAULT ('')`);
        await q.query(`ALTER TABLE tasks ADD COLUMN completionNote varchar NOT NULL DEFAULT ('')`);
    }
    async down(q) {
        await q.query(`ALTER TABLE tasks DROP COLUMN completionNote`);
        await q.query(`ALTER TABLE tasks DROP COLUMN completionDifficulty`);
        await q.query(`ALTER TABLE tasks DROP COLUMN actualTests`);
        await q.query(`ALTER TABLE tasks DROP COLUMN actualMinutes`);
    }
}
exports.TaskCompletionFeedback1724143800000 = TaskCompletionFeedback1724143800000;
//# sourceMappingURL=1724143800000-TaskCompletionFeedback.js.map