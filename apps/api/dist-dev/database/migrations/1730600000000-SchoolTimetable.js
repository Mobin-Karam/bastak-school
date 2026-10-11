"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolTimetable1730600000000 = void 0;
class SchoolTimetable1730600000000 {
    name = "SchoolTimetable1730600000000";
    async up(q) {
        const statements = [
            "CREATE TABLE \"timetable_academic_years\" (id varchar(36) PRIMARY KEY NOT NULL, \"organizationId\" varchar(36) NOT NULL, \"name\" varchar(240) NOT NULL, \"startsOn\" varchar(10) NOT NULL, \"endsOn\" varchar(10) NOT NULL, \"timeZone\" varchar(64) NOT NULL DEFAULT 'Asia/Tehran', \"active\" boolean NOT NULL DEFAULT 0, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"organizationId\") REFERENCES \"organizations\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_academic_years_organizationId_name\" ON \"timetable_academic_years\" (\"organizationId\", \"name\")",
            "CREATE INDEX \"IDX_timetable_academic_years_organizationId\" ON \"timetable_academic_years\"(\"organizationId\")",
            "CREATE TABLE \"timetable_terms\" (id varchar(36) PRIMARY KEY NOT NULL, \"yearId\" varchar(36) NOT NULL, \"name\" varchar(240) NOT NULL, \"startsOn\" varchar(10) NOT NULL, \"endsOn\" varchar(10) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"yearId\") REFERENCES \"timetable_academic_years\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_terms_yearId_name\" ON \"timetable_terms\" (\"yearId\", \"name\")",
            "CREATE INDEX \"IDX_timetable_terms_yearId\" ON \"timetable_terms\"(\"yearId\")",
            "CREATE TABLE \"timetable_sections\" (id varchar(36) PRIMARY KEY NOT NULL, \"organizationId\" varchar(36) NOT NULL, \"name\" varchar(240) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"organizationId\") REFERENCES \"organizations\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_sections_organizationId_name\" ON \"timetable_sections\" (\"organizationId\", \"name\")",
            "CREATE INDEX \"IDX_timetable_sections_organizationId\" ON \"timetable_sections\"(\"organizationId\")",
            "CREATE TABLE \"timetable_locations\" (id varchar(36) PRIMARY KEY NOT NULL, \"organizationId\" varchar(36) NOT NULL, \"name\" varchar(240) NOT NULL, \"capacity\" integer NOT NULL DEFAULT 0, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"organizationId\") REFERENCES \"organizations\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_locations_organizationId_name\" ON \"timetable_locations\" (\"organizationId\", \"name\")",
            "CREATE INDEX \"IDX_timetable_locations_organizationId\" ON \"timetable_locations\"(\"organizationId\")",
            "CREATE TABLE \"timetable_bells\" (id varchar(36) PRIMARY KEY NOT NULL, \"organizationId\" varchar(36) NOT NULL, \"sectionId\" varchar(36), \"name\" varchar(240) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"organizationId\") REFERENCES \"organizations\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"sectionId\") REFERENCES \"timetable_sections\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_bells_organizationId_name\" ON \"timetable_bells\" (\"organizationId\", \"name\")",
            "CREATE INDEX \"IDX_timetable_bells_organizationId\" ON \"timetable_bells\"(\"organizationId\")",
            "CREATE INDEX \"IDX_timetable_bells_sectionId\" ON \"timetable_bells\"(\"sectionId\")",
            "CREATE TABLE \"timetable_daily_sessions\" (id varchar(36) PRIMARY KEY NOT NULL, \"bellId\" varchar(36) NOT NULL, \"name\" varchar(240) NOT NULL, \"kind\" varchar(20) NOT NULL DEFAULT 'MORNING', \"startTime\" varchar(5) NOT NULL, \"endTime\" varchar(5) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"bellId\") REFERENCES \"timetable_bells\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_daily_sessions_bellId_name\" ON \"timetable_daily_sessions\" (\"bellId\", \"name\")",
            "CREATE INDEX \"IDX_timetable_daily_sessions_bellId\" ON \"timetable_daily_sessions\"(\"bellId\")",
            "CREATE TABLE \"timetable_periods\" (id varchar(36) PRIMARY KEY NOT NULL, \"sessionId\" varchar(36) NOT NULL, \"name\" varchar(240) NOT NULL, \"ordinal\" integer NOT NULL DEFAULT 0, \"startTime\" varchar(5) NOT NULL, \"endTime\" varchar(5) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"sessionId\") REFERENCES \"timetable_daily_sessions\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_periods_sessionId_ordinal\" ON \"timetable_periods\" (\"sessionId\", \"ordinal\")",
            "CREATE INDEX \"IDX_timetable_periods_sessionId\" ON \"timetable_periods\"(\"sessionId\")",
            "CREATE TABLE \"timetable_versions\" (id varchar(36) PRIMARY KEY NOT NULL, \"termId\" varchar(36) NOT NULL, \"name\" varchar(240) NOT NULL, \"state\" varchar(20) NOT NULL DEFAULT 'DRAFT', \"revision\" integer NOT NULL DEFAULT 0, \"effectiveOn\" varchar(10) NOT NULL, \"publishedAt\" datetime, \"reason\" text NOT NULL DEFAULT '', \"createdById\" varchar(36) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"termId\") REFERENCES \"timetable_terms\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"createdById\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT)",
            "CREATE INDEX \"IDX_timetable_versions_termId\" ON \"timetable_versions\"(\"termId\")",
            "CREATE INDEX \"IDX_timetable_versions_createdById\" ON \"timetable_versions\"(\"createdById\")",
            "CREATE TABLE \"timetable_holidays\" (id varchar(36) PRIMARY KEY NOT NULL, \"termId\" varchar(36) NOT NULL, \"date\" varchar(10) NOT NULL, \"name\" varchar(240) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"termId\") REFERENCES \"timetable_terms\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_holidays_termId_date\" ON \"timetable_holidays\" (\"termId\", \"date\")",
            "CREATE INDEX \"IDX_timetable_holidays_termId\" ON \"timetable_holidays\"(\"termId\")",
            "CREATE TABLE \"timetable_teacher_availability\" (id varchar(36) PRIMARY KEY NOT NULL, \"organizationId\" varchar(36) NOT NULL, \"teacherId\" varchar(36) NOT NULL, \"weekday\" integer NOT NULL DEFAULT 0, \"startTime\" varchar(5) NOT NULL, \"endTime\" varchar(5) NOT NULL, \"startsOn\" varchar(10) NOT NULL, \"endsOn\" varchar(10) NOT NULL, \"reason\" text NOT NULL DEFAULT '', createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"organizationId\") REFERENCES \"organizations\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"teacherId\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT)",
            "CREATE INDEX \"IDX_timetable_teacher_availability_organizationId\" ON \"timetable_teacher_availability\"(\"organizationId\")",
            "CREATE INDEX \"IDX_timetable_teacher_availability_teacherId\" ON \"timetable_teacher_availability\"(\"teacherId\")",
            "CREATE TABLE \"timetable_allocations\" (id varchar(36) PRIMARY KEY NOT NULL, \"versionId\" varchar(36) NOT NULL, \"classroomId\" varchar(36) NOT NULL, \"classBookId\" varchar(36) NOT NULL, \"lessonsPerWeek\" integer NOT NULL DEFAULT 0, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"versionId\") REFERENCES \"timetable_versions\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"classroomId\") REFERENCES \"education_classes\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"classBookId\") REFERENCES \"education_class_books\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_allocations_versionId_classBookId\" ON \"timetable_allocations\" (\"versionId\", \"classBookId\")",
            "CREATE INDEX \"IDX_timetable_allocations_versionId\" ON \"timetable_allocations\"(\"versionId\")",
            "CREATE INDEX \"IDX_timetable_allocations_classroomId\" ON \"timetable_allocations\"(\"classroomId\")",
            "CREATE INDEX \"IDX_timetable_allocations_classBookId\" ON \"timetable_allocations\"(\"classBookId\")",
            "CREATE TABLE \"timetable_overrides\" (id varchar(36) PRIMARY KEY NOT NULL, \"versionId\" varchar(36) NOT NULL, \"lessonId\" varchar(36) NOT NULL, \"date\" varchar(10) NOT NULL, \"cancelled\" boolean NOT NULL DEFAULT 0, \"teacherId\" varchar(36), \"locationId\" varchar(36), \"startTime\" varchar(5), \"endTime\" varchar(5), \"reason\" text NOT NULL DEFAULT '', \"changedById\" varchar(36) NOT NULL, \"changedByName\" varchar(240) NOT NULL, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"versionId\") REFERENCES \"timetable_versions\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"lessonId\") REFERENCES \"school_schedule_entries\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"teacherId\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"locationId\") REFERENCES \"timetable_locations\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"changedById\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_overrides_lessonId_date\" ON \"timetable_overrides\" (\"lessonId\", \"date\")",
            "CREATE INDEX \"IDX_timetable_overrides_versionId\" ON \"timetable_overrides\"(\"versionId\")",
            "CREATE INDEX \"IDX_timetable_overrides_lessonId\" ON \"timetable_overrides\"(\"lessonId\")",
            "CREATE INDEX \"IDX_timetable_overrides_teacherId\" ON \"timetable_overrides\"(\"teacherId\")",
            "CREATE INDEX \"IDX_timetable_overrides_locationId\" ON \"timetable_overrides\"(\"locationId\")",
            "CREATE INDEX \"IDX_timetable_overrides_changedById\" ON \"timetable_overrides\"(\"changedById\")",
            "CREATE TABLE \"timetable_occurrences\" (id varchar(36) PRIMARY KEY NOT NULL, \"lessonId\" varchar(36) NOT NULL, \"date\" varchar(10) NOT NULL, \"attendanceSessionId\" varchar(36), createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"lessonId\") REFERENCES \"school_schedule_entries\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"attendanceSessionId\") REFERENCES \"attendance_sessions\"(\"id\") ON DELETE RESTRICT)",
            "CREATE UNIQUE INDEX \"UQ_timetable_occurrences_lessonId_date\" ON \"timetable_occurrences\" (\"lessonId\", \"date\")",
            "CREATE INDEX \"IDX_timetable_occurrences_lessonId\" ON \"timetable_occurrences\"(\"lessonId\")",
            "CREATE INDEX \"IDX_timetable_occurrences_attendanceSessionId\" ON \"timetable_occurrences\"(\"attendanceSessionId\")",
            "CREATE TABLE \"timetable_changes\" (id varchar(36) PRIMARY KEY NOT NULL, \"versionId\" varchar(36) NOT NULL, \"lessonId\" varchar(36), \"action\" varchar(240) NOT NULL, \"reason\" text NOT NULL DEFAULT '', \"actorId\" varchar(36) NOT NULL, \"actorName\" varchar(240) NOT NULL, \"beforeText\" text NOT NULL DEFAULT '', \"afterText\" text NOT NULL DEFAULT '', createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"versionId\") REFERENCES \"timetable_versions\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"lessonId\") REFERENCES \"school_schedule_entries\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"actorId\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT)",
            "CREATE INDEX \"IDX_timetable_changes_versionId\" ON \"timetable_changes\"(\"versionId\")",
            "CREATE INDEX \"IDX_timetable_changes_lessonId\" ON \"timetable_changes\"(\"lessonId\")",
            "CREATE INDEX \"IDX_timetable_changes_actorId\" ON \"timetable_changes\"(\"actorId\")",
            "CREATE TABLE \"timetable_imports\" (id varchar(36) PRIMARY KEY NOT NULL, \"versionId\" varchar(36) NOT NULL, \"actorId\" varchar(36) NOT NULL, \"filename\" varchar(240) NOT NULL, \"sheetName\" varchar(240) NOT NULL, \"rowCount\" integer NOT NULL DEFAULT 0, \"revision\" integer NOT NULL DEFAULT 0, createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(\"versionId\") REFERENCES \"timetable_versions\"(\"id\") ON DELETE RESTRICT, FOREIGN KEY(\"actorId\") REFERENCES \"users\"(\"id\") ON DELETE RESTRICT)",
            "CREATE INDEX \"IDX_timetable_imports_versionId\" ON \"timetable_imports\"(\"versionId\")",
            "CREATE INDEX \"IDX_timetable_imports_actorId\" ON \"timetable_imports\"(\"actorId\")",
            "ALTER TABLE school_schedule_entries ADD COLUMN versionId varchar(36) REFERENCES timetable_versions(id) ON DELETE RESTRICT",
            "ALTER TABLE school_schedule_entries ADD COLUMN periodId varchar(36) REFERENCES timetable_periods(id) ON DELETE RESTRICT",
            "ALTER TABLE school_schedule_entries ADD COLUMN locationId varchar(36) REFERENCES timetable_locations(id) ON DELETE RESTRICT",
            "ALTER TABLE school_schedule_entries ADD COLUMN startsOn varchar(10)",
            "ALTER TABLE school_schedule_entries ADD COLUMN endsOn varchar(10)",
            "ALTER TABLE school_schedule_entries ADD COLUMN notes text NOT NULL DEFAULT ''",
            "ALTER TABLE school_schedule_entries ADD COLUMN classroomNameSnapshot varchar(240) NOT NULL DEFAULT ''",
            "ALTER TABLE school_schedule_entries ADD COLUMN teacherNameSnapshot varchar(240) NOT NULL DEFAULT ''",
            "CREATE INDEX IDX_schedule_version ON school_schedule_entries(versionId)",
            "ALTER TABLE education_classes ADD COLUMN timetableSectionId varchar(36) REFERENCES timetable_sections(id) ON DELETE RESTRICT"
        ];
        for (const statement of statements)
            await q.query(statement);
        for (const code of ["schedule.publish", "schedule.read.all"]) {
            await q.query(`INSERT OR IGNORE INTO permissions(id,code,description) VALUES(lower(hex(randomblob(16))),?,?)`, [code, code]);
        }
        for (const role of ["PRINCIPAL", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"])
            for (const code of ["schedule.publish", "schedule.read.all"])
                await q.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code=?`, [role, code]);
        for (const role of ["DISCIPLINARIAN", "STUDENT_AFFAIRS_MENTOR"])
            await q.query(`INSERT OR IGNORE INTO role_permissions(id,roleId,permissionId) SELECT lower(hex(randomblob(16))),r.id,p.id FROM roles r,permissions p WHERE r.code=? AND p.code IN ('schedule.read','schedule.read.all')`, [role]);
    }
    async down(q) {
        const rows = await q.query(`SELECT COUNT(*) AS count FROM timetable_versions`);
        if (Number(rows[0].count))
            throw new Error("Timetable versions exist; preserve published and attendance history with an application rollback.");
        throw new Error("Additive timetable schema requires an application rollback; do not drop historical relations.");
    }
}
exports.SchoolTimetable1730600000000 = SchoolTimetable1730600000000;
//# sourceMappingURL=1730600000000-SchoolTimetable.js.map