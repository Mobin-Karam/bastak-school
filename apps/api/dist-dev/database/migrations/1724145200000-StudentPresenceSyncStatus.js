"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentPresenceSyncStatus1724145200000 = void 0;
class StudentPresenceSyncStatus1724145200000 {
    name = "StudentPresenceSyncStatus1724145200000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE student_presence ADD COLUMN syncStatus varchar(16) NOT NULL DEFAULT ('online')");
    }
    async down(queryRunner) {
        await queryRunner.query("ALTER TABLE student_presence DROP COLUMN syncStatus");
    }
}
exports.StudentPresenceSyncStatus1724145200000 = StudentPresenceSyncStatus1724145200000;
//# sourceMappingURL=1724145200000-StudentPresenceSyncStatus.js.map