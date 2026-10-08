"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCreatedAt1724140500000 = void 0;
class NotificationCreatedAt1724140500000 {
    name = "NotificationCreatedAt1724140500000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE notifications ADD COLUMN createdAt datetime NOT NULL DEFAULT (datetime('now'))");
    }
    async down(queryRunner) {
        await queryRunner.query("ALTER TABLE notifications DROP COLUMN createdAt");
    }
}
exports.NotificationCreatedAt1724140500000 = NotificationCreatedAt1724140500000;
//# sourceMappingURL=1724140500000-NotificationCreatedAt.js.map