"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardianChatPrivacy1724144100000 = void 0;
class GuardianChatPrivacy1724144100000 {
    name = "GuardianChatPrivacy1724144100000";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE students ADD COLUMN guardianChatReadOnly boolean NOT NULL DEFAULT (0)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE students DROP COLUMN guardianChatReadOnly`);
    }
}
exports.GuardianChatPrivacy1724144100000 = GuardianChatPrivacy1724144100000;
//# sourceMappingURL=1724144100000-GuardianChatPrivacy.js.map