"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceWriteReceipts1730100000000 = void 0;
class AttendanceWriteReceipts1730100000000 {
    name = "AttendanceWriteReceipts1730100000000";
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE attendance_write_receipts (
      id varchar PRIMARY KEY NOT NULL,
      organizationId varchar NOT NULL,
      actorId varchar NOT NULL,
      sessionId varchar NOT NULL,
      requestId varchar(36) NOT NULL,
      fingerprint varchar(64) NOT NULL,
      result text NOT NULL,
      createdAt datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (actorId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sessionId) REFERENCES attendance_sessions(id) ON DELETE CASCADE
    )`);
        await queryRunner.query("CREATE UNIQUE INDEX IDX_attendance_request_receipt ON attendance_write_receipts(organizationId, actorId, requestId)");
    }
    async down(queryRunner) {
        await queryRunner.query("DROP TABLE attendance_write_receipts");
    }
}
exports.AttendanceWriteReceipts1730100000000 = AttendanceWriteReceipts1730100000000;
//# sourceMappingURL=1730100000000-AttendanceWriteReceipts.js.map