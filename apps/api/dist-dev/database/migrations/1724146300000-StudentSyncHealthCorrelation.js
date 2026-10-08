"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentSyncHealthCorrelation1724146300000 = void 0;
class StudentSyncHealthCorrelation1724146300000 {
    name = "StudentSyncHealthCorrelation1724146300000";
    async up(queryRunner) {
        await queryRunner.query("ALTER TABLE student_sync_health ADD COLUMN correlationId varchar(36)");
    }
    async down() { }
}
exports.StudentSyncHealthCorrelation1724146300000 = StudentSyncHealthCorrelation1724146300000;
//# sourceMappingURL=1724146300000-StudentSyncHealthCorrelation.js.map