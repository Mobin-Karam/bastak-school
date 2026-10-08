"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskIssueModeration1724142800000 = void 0;
class TaskIssueModeration1724142800000 {
    name = "TaskIssueModeration1724142800000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE task_issues ADD COLUMN advisorNote varchar(2000) NOT NULL DEFAULT ('')`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE task_issues DROP COLUMN advisorNote`);
    }
}
exports.TaskIssueModeration1724142800000 = TaskIssueModeration1724142800000;
//# sourceMappingURL=1724142800000-TaskIssueModeration.js.map