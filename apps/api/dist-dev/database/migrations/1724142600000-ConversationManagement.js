"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationManagement1724142600000 = void 0;
class ConversationManagement1724142600000 {
    name = "ConversationManagement1724142600000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE conversations ADD COLUMN description varchar NOT NULL DEFAULT ('')`);
        await queryRunner.query(`ALTER TABLE conversations ADD COLUMN permissions text NOT NULL DEFAULT ('{}')`);
        await queryRunner.query(`ALTER TABLE conversations ADD COLUMN archivedAt datetime`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE conversations DROP COLUMN archivedAt`);
        await queryRunner.query(`ALTER TABLE conversations DROP COLUMN permissions`);
        await queryRunner.query(`ALTER TABLE conversations DROP COLUMN description`);
    }
}
exports.ConversationManagement1724142600000 = ConversationManagement1724142600000;
//# sourceMappingURL=1724142600000-ConversationManagement.js.map