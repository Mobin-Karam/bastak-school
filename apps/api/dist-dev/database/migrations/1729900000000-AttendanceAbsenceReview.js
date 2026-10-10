"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceAbsenceReview1729900000000 = void 0;
class AttendanceAbsenceReview1729900000000 {
    name = "AttendanceAbsenceReview1729900000000";
    async up(q) {
        await q.query("ALTER TABLE attendance_records ADD COLUMN reviewStatus varchar(16)");
        await q.query("ALTER TABLE attendance_records ADD COLUMN reviewNote text NOT NULL DEFAULT ''");
        await q.query("ALTER TABLE attendance_records ADD COLUMN reviewedById varchar");
        await q.query("ALTER TABLE attendance_records ADD COLUMN reviewedAt datetime");
        await q.query("CREATE INDEX IF NOT EXISTS IDX_attendance_record_review_status ON attendance_records(reviewStatus)");
        await q.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),'attendance.review','بررسی دلیل غیبت')");
        for (const role of ["PRINCIPAL", "SCHOOL_SUPERVISOR", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"])
            await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code='attendance.review'", [role]);
    }
    async down(q) {
        await q.query("DROP INDEX IF EXISTS IDX_attendance_record_review_status");
    }
}
exports.AttendanceAbsenceReview1729900000000 = AttendanceAbsenceReview1729900000000;
//# sourceMappingURL=1729900000000-AttendanceAbsenceReview.js.map