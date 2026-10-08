"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentGuardianSelection1724144400000 = void 0;
class StudentGuardianSelection1724144400000 {
    name = "StudentGuardianSelection1724144400000";
    async up(queryRunner) { await queryRunner.query(`ALTER TABLE students ADD COLUMN guardianChangedAt datetime`); }
    async down(queryRunner) { await queryRunner.query(`ALTER TABLE students DROP COLUMN guardianChangedAt`); }
}
exports.StudentGuardianSelection1724144400000 = StudentGuardianSelection1724144400000;
//# sourceMappingURL=1724144400000-StudentGuardianSelection.js.map