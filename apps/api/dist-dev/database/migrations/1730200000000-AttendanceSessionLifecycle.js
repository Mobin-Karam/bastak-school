"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSessionLifecycle1730200000000 = void 0;
class AttendanceSessionLifecycle1730200000000 {
    name = "AttendanceSessionLifecycle1730200000000";
    async up(q) {
        const sessionColumns = [
            "occurrenceKey varchar(240)",
            "creationFingerprint varchar(64)",
            "titleSnapshot varchar(160) NOT NULL DEFAULT ''",
            "timeZone varchar(64) NOT NULL DEFAULT 'Asia/Tehran'",
            "operationalDate varchar(10)",
            "scheduledStartAt datetime",
            "scheduledEndAt datetime",
            "status varchar(20) NOT NULL DEFAULT 'open'",
            "revision integer NOT NULL DEFAULT 0",
            "assignedStaffId varchar REFERENCES users(id) ON DELETE SET NULL",
            "submittedById varchar REFERENCES users(id) ON DELETE SET NULL",
            "submittedAt datetime",
            "rosterSnapshot text",
            "sourceKind varchar(32)",
            "sourceScheduleId varchar(36)",
            "rosterCapturedAt datetime",
            "assignedStaffNameSnapshot varchar(160) NOT NULL DEFAULT ''",
        ];
        for (const column of sessionColumns)
            await q.query(`ALTER TABLE attendance_sessions ADD COLUMN ${column}`);
        await q.query("CREATE UNIQUE INDEX IDX_attendance_session_occurrence ON attendance_sessions(organizationId, occurrenceKey)");
        for (const column of [
            "physicalStatus varchar(20)",
            "revision integer NOT NULL DEFAULT 0",
            "minutesLate integer",
            "arrivalAt datetime",
        ])
            await q.query(`ALTER TABLE attendance_records ADD COLUMN ${column}`);
        await q.query(`UPDATE attendance_records SET physicalStatus = CASE
      WHEN status IN ('present','absent','late') THEN status
      WHEN status = 'excused' AND reviewStatus = 'approved' THEN 'absent'
      ELSE 'legacy_unknown' END`);
        await q.query(`UPDATE attendance_sessions SET status = 'submitted'
      WHERE EXISTS (SELECT 1 FROM attendance_records r WHERE r.sessionId = attendance_sessions.id)`);
        await q.query(`CREATE TABLE attendance_policies (
      id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL UNIQUE,
      timeZone varchar(64) NOT NULL DEFAULT 'Asia/Tehran', dayStartsAt varchar(5) NOT NULL DEFAULT '04:00',
      allowPartialSubmission boolean NOT NULL DEFAULT 1, lateCountsAsPresent boolean NOT NULL DEFAULT 1,
      updatedAt datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE
    )`);
        await q.query(`CREATE TABLE attendance_schedules (
      id varchar PRIMARY KEY NOT NULL, organizationId varchar NOT NULL, contextType varchar(24) NOT NULL,
      contextId varchar(120) NOT NULL, title varchar(160) NOT NULL, weekday integer NOT NULL,
      startTime varchar(5) NOT NULL, endTime varchar(5) NOT NULL, assignedStaffId varchar,
      status varchar(20) NOT NULL DEFAULT 'ACTIVE', createdAt datetime NOT NULL DEFAULT (datetime('now')),
      updatedAt datetime NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY(assignedStaffId) REFERENCES users(id) ON DELETE SET NULL
    )`);
        await q.query("CREATE INDEX IDX_attendance_schedule_day ON attendance_schedules(organizationId, weekday, status)");
        const grants = {
            PRINCIPAL: [
                "attendance.correct",
                "attendance.reports.read",
                "attendance.settings.manage",
                "attendance.delegate",
            ],
            SCHOOL_SUPERVISOR: [
                "attendance.correct",
                "attendance.reports.read",
                "attendance.delegate",
            ],
            ORGANIZATION_ADMIN: [
                "attendance.correct",
                "attendance.reports.read",
                "attendance.settings.manage",
                "attendance.delegate",
            ],
            PLATFORM_ADMIN: [
                "attendance.correct",
                "attendance.reports.read",
                "attendance.settings.manage",
                "attendance.delegate",
            ],
            TEACHER: ["attendance.reports.read"],
            STUDENT: ["attendance.self.request"],
        };
        for (const [role, permissions] of Object.entries(grants))
            for (const code of permissions) {
                await q.query("INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,'Attendance workflow capability')", [code]);
                await q.query("INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?", [role, code]);
            }
    }
    async down() {
        throw new Error("Attendance session lifecycle is forward-only. Restore compatible application code without deleting saved attendance facts.");
    }
}
exports.AttendanceSessionLifecycle1730200000000 = AttendanceSessionLifecycle1730200000000;
//# sourceMappingURL=1730200000000-AttendanceSessionLifecycle.js.map