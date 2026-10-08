"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatReactionConfiguration1724144000000 = void 0;
class ChatReactionConfiguration1724144000000 {
    name = "ChatReactionConfiguration1724144000000";
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "chat_configuration" (
      "id" varchar(32) PRIMARY KEY NOT NULL,
      "allowedEmojis" text NOT NULL,
      "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
    )`);
        await queryRunner.query(`INSERT INTO "chat_configuration" ("id", "allowedEmojis") VALUES ('platform', ?)`, [JSON.stringify(["❤️", "👍", "😂", "👏", "😮", "😢", "🔥", "🎉", "🙏", "✅"])]);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "chat_configuration"`);
    }
}
exports.ChatReactionConfiguration1724144000000 = ChatReactionConfiguration1724144000000;
//# sourceMappingURL=1724144000000-ChatReactionConfiguration.js.map