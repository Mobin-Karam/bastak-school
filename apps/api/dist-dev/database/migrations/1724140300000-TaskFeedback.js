"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskFeedback1724140300000 = void 0;
class TaskFeedback1724140300000 {
    name = "TaskFeedback1724140300000";
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS task_comments (id varchar PRIMARY KEY NOT NULL, text varchar(2000) NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime('now')), taskId varchar, studentId varchar, CONSTRAINT FK_task_comments_task FOREIGN KEY (taskId) REFERENCES tasks (id) ON DELETE CASCADE, CONSTRAINT FK_task_comments_student FOREIGN KEY (studentId) REFERENCES students (id) ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_task_comments_task_student ON task_comments (taskId, studentId)`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS task_issues (id varchar PRIMARY KEY NOT NULL, type varchar(120) NOT NULL, description varchar(2000) NOT NULL DEFAULT (''), status varchar(24) NOT NULL DEFAULT ('OPEN'), createdAt datetime NOT NULL DEFAULT (datetime('now')), taskId varchar, studentId varchar, CONSTRAINT FK_task_issues_task FOREIGN KEY (taskId) REFERENCES tasks (id) ON DELETE CASCADE, CONSTRAINT FK_task_issues_student FOREIGN KEY (studentId) REFERENCES students (id) ON DELETE CASCADE)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS IDX_task_issues_task_student ON task_issues (taskId, studentId)`);
    }
    async down() { }
}
exports.TaskFeedback1724140300000 = TaskFeedback1724140300000;
//# sourceMappingURL=1724140300000-TaskFeedback.js.map