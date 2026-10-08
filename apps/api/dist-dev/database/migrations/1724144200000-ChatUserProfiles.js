"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatUserProfiles1724144200000 = void 0;
class ChatUserProfiles1724144200000 {
    name = "ChatUserProfiles1724144200000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE users ADD COLUMN chatDisplayName varchar(100) NOT NULL DEFAULT ('')`);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN chatBio varchar(500) NOT NULL DEFAULT ('')`);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN chatAvatarUrl varchar(1200) NOT NULL DEFAULT ('')`);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN usernameChangeCount integer NOT NULL DEFAULT (0)`);
        await queryRunner.query(`ALTER TABLE users ADD COLUMN usernameChangedAt datetime`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE users DROP COLUMN usernameChangedAt`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN usernameChangeCount`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN chatAvatarUrl`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN chatBio`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN chatDisplayName`);
    }
}
exports.ChatUserProfiles1724144200000 = ChatUserProfiles1724144200000;
//# sourceMappingURL=1724144200000-ChatUserProfiles.js.map