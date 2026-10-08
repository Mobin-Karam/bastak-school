"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessageReadState1724140400000 = void 0;
class ChatMessageReadState1724140400000 {
    name = "ChatMessageReadState1724140400000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE chat_messages ADD COLUMN readAt datetime");
    }
    async down(queryRunner) {
        await queryRunner.query("ALTER TABLE chat_messages DROP COLUMN readAt");
    }
}
exports.ChatMessageReadState1724140400000 = ChatMessageReadState1724140400000;
//# sourceMappingURL=1724140400000-ChatMessageReadState.js.map