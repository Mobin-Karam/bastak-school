"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatTaskLinks1724144500000 = void 0;
class ChatTaskLinks1724144500000 {
    name = "ChatTaskLinks1724144500000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE chat_messages ADD COLUMN linkedTaskId varchar`);
        await queryRunner.query(`CREATE INDEX IDX_chat_message_linked_task ON chat_messages(linkedTaskId)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IDX_chat_message_linked_task`);
        await queryRunner.query(`ALTER TABLE chat_messages DROP COLUMN linkedTaskId`);
    }
}
exports.ChatTaskLinks1724144500000 = ChatTaskLinks1724144500000;
//# sourceMappingURL=1724144500000-ChatTaskLinks.js.map