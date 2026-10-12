"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DormWideAttendanceDelegation1730500000000 = void 0;
class DormWideAttendanceDelegation1730500000000 {
    name = "DormWideAttendanceDelegation1730500000000";
    async up(q) { await q.query("ALTER TABLE dorm_attendance_delegates ADD COLUMN dormWide boolean NOT NULL DEFAULT 0"); }
    async down(q) {
        if ((await q.query("SELECT COUNT(*) AS count FROM dorm_attendance_delegates WHERE dormWide = 1"))[0].count > 0)
            throw new Error("Saved dorm-wide grants require an application rollback.");
        await q.query("ALTER TABLE dorm_attendance_delegates DROP COLUMN dormWide");
    }
}
exports.DormWideAttendanceDelegation1730500000000 = DormWideAttendanceDelegation1730500000000;
//# sourceMappingURL=1730500000000-DormWideAttendanceDelegation.js.map