const test = require("node:test");
const assert = require("node:assert/strict");
const Database = require("better-sqlite3");
const { inventory, preserved } = require("./database-recovery.cjs");

function fixture() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE roles (id TEXT PRIMARY KEY, organizationScoped INTEGER NOT NULL);
    CREATE TABLE user_role_assignments (id TEXT PRIMARY KEY, userId TEXT NOT NULL, roleId TEXT NOT NULL, membershipId TEXT);
    INSERT INTO roles VALUES ('student', 1), ('platform-admin', 0);
    INSERT INTO user_role_assignments VALUES
      ('orphaned-student', 'student-user', 'student', NULL),
      ('retained-admin', 'admin-user', 'platform-admin', NULL);
  `);
  return db;
}

test("preserves existing dorm attendance and exit permissions while adding delegate snapshots and departure origin", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE attendance_sessions (id TEXT PRIMARY KEY, title TEXT NOT NULL);
    CREATE TABLE exit_permissions (id TEXT PRIMARY KEY, status TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO attendance_sessions VALUES ('session-1', 'Dorm attendance');
    INSERT INTO exit_permissions VALUES ('exit-1', 'approved');
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE attendance_sessions ADD COLUMN dormAttendanceRole TEXT;
    ALTER TABLE attendance_sessions ADD COLUMN dormDelegateStudentIdSnapshot TEXT;
    ALTER TABLE attendance_sessions ADD COLUMN dormDelegateStudentNameSnapshot TEXT;
    ALTER TABLE exit_permissions ADD COLUMN origin TEXT;
    INSERT INTO migrations VALUES ('DormAttendancePrimaryAndRoomChecks1762800000000');
    INSERT INTO migrations VALUES ('DormUnauthorizedDepartureOrigin1762900000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE exit_permissions SET origin='dorm_unauthorized' WHERE id='exit-1'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /non-null value in origin/,
  );
  db.close();
});

test("permits only the migration's orphaned scoped-role deletion", () => {
  const db = fixture();
  const before = inventory(db);
  db.prepare(
    "DELETE FROM user_role_assignments WHERE id='orphaned-student'",
  ).run();
  assert.doesNotThrow(() => preserved(before, inventory(db)));
  db.close();
});

test("allows only the empty teacher-message default added to prior attendance reviews", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE attendance_session_reviews (id TEXT PRIMARY KEY, reviewedRevision INTEGER NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO attendance_session_reviews VALUES ('review-1', 2);
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE attendance_session_reviews ADD COLUMN teacherMessage varchar(500) NOT NULL DEFAULT '';
    INSERT INTO migrations VALUES ('AttendanceReviewTeacherMessage1762400000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE attendance_session_reviews SET teacherMessage='unrelated' WHERE id='review-1'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /non-default value in teacherMessage/,
  );
  db.close();
});

test("preserves historical attendance reviews while adding nullable revision dedupe keys", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE attendance_session_reviews (id TEXT PRIMARY KEY, reviewedRevision INTEGER NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO attendance_session_reviews VALUES ('review-1', 2);
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE attendance_session_reviews ADD COLUMN dedupeKey varchar(96);
    CREATE UNIQUE INDEX IDX_attendance_session_review_dedupe ON attendance_session_reviews(dedupeKey);
    INSERT INTO migrations VALUES ('AttendanceRevisionReviewIdempotency1763600400000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE attendance_session_reviews SET dedupeKey='unexpected' WHERE id='review-1'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /non-null value in dedupeKey/,
  );
  db.close();
});

test("preserves historical leave requests while adding timed departure details", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE leave_requests (id TEXT PRIMARY KEY, reason TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO leave_requests VALUES ('leave-1', 'Retained reason');
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE leave_requests ADD COLUMN includesLunch boolean NOT NULL DEFAULT 0;
    ALTER TABLE leave_requests ADD COLUMN includesDinner boolean NOT NULL DEFAULT 0;
    ALTER TABLE leave_requests ADD COLUMN exitPermissionId varchar;
    INSERT INTO migrations VALUES ('StudentLeaveTimingAndMeals1762500000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE leave_requests SET includesLunch=1 WHERE id='leave-1'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /non-default value in includesLunch/,
  );
  db.close();
});

test("preserves leave and schedule history while adding explicit leave ownership", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE teacher_leave_requests (id TEXT PRIMARY KEY, reason TEXT NOT NULL);
    CREATE TABLE school_schedule_entries (id TEXT PRIMARY KEY, title TEXT NOT NULL);
    CREATE TABLE school_schedule_occurrence_overrides (id TEXT PRIMARY KEY, entryId TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO teacher_leave_requests VALUES ('leave-1', 'Retained reason');
    INSERT INTO school_schedule_entries VALUES ('entry-1', 'Retained lesson');
    INSERT INTO school_schedule_occurrence_overrides VALUES ('override-1', 'entry-1');
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE teacher_leave_requests ADD COLUMN updatedAt datetime;
    ALTER TABLE school_schedule_entries ADD COLUMN leaveRequestId varchar(36);
    CREATE INDEX IDX_schedule_entries_leave_request ON school_schedule_entries(leaveRequestId);
    CREATE INDEX IDX_schedule_occurrence_overrides_leave_request ON school_schedule_occurrence_overrides(entryId);
    INSERT INTO migrations VALUES ('TeacherLeaveWorkflowIntegrity1763400000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE school_schedule_entries SET leaveRequestId='unexpected' WHERE id='entry-1'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /non-null value in leaveRequestId/,
  );
  db.close();
});

test("preserves existing sessions while adding nullable activity tracking", () => {
  const db = new Database(":memory:");
  db.exec(
    `CREATE TABLE sessions (id TEXT PRIMARY KEY, tokenHash TEXT NOT NULL, createdAt datetime NOT NULL); CREATE TABLE migrations (name TEXT); INSERT INTO sessions VALUES ('session-1','kept','2026-01-01');`,
  );
  const before = inventory(db);
  db.exec(
    "ALTER TABLE sessions ADD COLUMN lastSeenAt datetime NULL; INSERT INTO migrations VALUES ('SessionLastSeenAt1763500000000')",
  );
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE sessions SET tokenHash='changed' WHERE id='session-1'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /existing logical records changed/,
  );
  db.close();
});

test("preserves existing authorization rows while adding the school-admin lifecycle grants", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE permissions (id TEXT PRIMARY KEY, code TEXT NOT NULL, description TEXT NOT NULL);
    CREATE TABLE role_permissions (id TEXT PRIMARY KEY, roleId TEXT NOT NULL, permissionId TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO permissions VALUES ('existing-permission', 'attendance.read', 'Retained');
    INSERT INTO role_permissions VALUES ('existing-grant', 'teacher', 'existing-permission');
  `);
  const before = inventory(db);
  db.exec(`
    INSERT INTO permissions VALUES ('student-read', 'students.read', 'Read student records');
    INSERT INTO permissions VALUES ('student-archive', 'students.archive', 'Archive a student account while retaining its history');
    INSERT INTO role_permissions VALUES ('school-admin-read', 'school-admin', 'student-read');
    INSERT INTO role_permissions VALUES ('school-admin-archive', 'school-admin', 'student-archive');
    INSERT INTO migrations VALUES ('StudentAccountLifecycleCapabilityAlignment1731800400000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE permissions SET description='changed' WHERE id='existing-permission'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /existing logical records changed/,
  );
  db.close();
});

test("preserves existing authorization rows while repairing principal announcement grants", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE roles (id TEXT PRIMARY KEY, code TEXT NOT NULL);
    CREATE TABLE permissions (id TEXT PRIMARY KEY, code TEXT NOT NULL, description TEXT NOT NULL);
    CREATE TABLE role_permissions (id TEXT PRIMARY KEY, roleId TEXT NOT NULL, permissionId TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO roles VALUES ('principal', 'PRINCIPAL');
    INSERT INTO permissions VALUES ('attendance-read', 'attendance.read', 'Retained');
    INSERT INTO role_permissions VALUES ('existing-grant', 'principal', 'attendance-read');
  `);
  const before = inventory(db);
  db.exec(`
    INSERT INTO permissions VALUES
      ('announcement-read', 'announcements.read', 'School announcement capability'),
      ('announcement-manage', 'announcements.manage', 'School announcement capability');
    INSERT INTO role_permissions VALUES
      ('principal-announcement-read', 'principal', 'announcement-read'),
      ('principal-announcement-manage', 'principal', 'announcement-manage');
    INSERT INTO migrations VALUES ('PrincipalAnnouncementManagementCapabilityRepair1762300700000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE permissions SET description='changed' WHERE id='attendance-read'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /existing logical records changed/,
  );
  db.close();
});

test("preserves authorization history while granting attendance correction to the academic manager", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE roles (id TEXT PRIMARY KEY, code TEXT NOT NULL);
    CREATE TABLE permissions (id TEXT PRIMARY KEY, code TEXT NOT NULL, description TEXT NOT NULL);
    CREATE TABLE role_permissions (id TEXT PRIMARY KEY, roleId TEXT NOT NULL, permissionId TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO roles VALUES ('religious-manager', 'RELIGIOUS_EDUCATION_MANAGER');
    INSERT INTO permissions VALUES ('attendance-manage', 'attendance.manage', 'Retained');
    INSERT INTO role_permissions VALUES ('existing-grant', 'religious-manager', 'attendance-manage');
  `);
  const before = inventory(db);
  db.exec(`
    INSERT INTO permissions VALUES ('attendance-correct', 'attendance.correct', 'Attendance correction');
    INSERT INTO role_permissions VALUES ('academic-correction', 'religious-manager', 'attendance-correct');
    INSERT INTO migrations VALUES ('ReligiousEducationAttendanceCorrectionAccess1762300800000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare("DELETE FROM role_permissions WHERE id='existing-grant'").run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /existing logical records changed/,
  );
  db.close();
});

test("preserves authorization history while adding principal student-movement resolution grants", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE roles (id TEXT PRIMARY KEY, code TEXT NOT NULL);
    CREATE TABLE permissions (id TEXT PRIMARY KEY, code TEXT NOT NULL, description TEXT NOT NULL);
    CREATE TABLE role_permissions (id TEXT PRIMARY KEY, roleId TEXT NOT NULL, permissionId TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO roles VALUES
      ('principal', 'PRINCIPAL'),
      ('school-admin', 'SCHOOL_ADMIN'),
      ('organization-admin', 'ORGANIZATION_ADMIN'),
      ('platform-admin', 'PLATFORM_ADMIN'),
      ('supervisor', 'SCHOOL_SUPERVISOR');
    INSERT INTO permissions VALUES ('retained-permission', 'attendance.read', 'Retained');
    INSERT INTO role_permissions VALUES ('retained-grant', 'principal', 'retained-permission');
  `);
  const before = inventory(db);
  db.exec(`
    INSERT INTO permissions VALUES
      ('movement-resolve', 'student.movement.resolve', 'Confirm a student is physically in school');
    INSERT INTO role_permissions VALUES
      ('principal-movement-resolve', 'principal', 'movement-resolve'),
      ('school-admin-movement-resolve', 'school-admin', 'movement-resolve'),
      ('admin-movement-resolve', 'organization-admin', 'movement-resolve'),
      ('platform-movement-resolve', 'platform-admin', 'movement-resolve');
    INSERT INTO migrations VALUES ('PrincipalStudentMovementResolution1763600200000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM role_permissions WHERE roleId='supervisor' AND permissionId='movement-resolve'",
      )
      .get().count,
    0,
  );
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM role_permissions WHERE roleId='school-admin' AND permissionId='movement-resolve'",
      )
      .get().count,
    1,
  );
  db.prepare("DELETE FROM role_permissions WHERE id='retained-grant'").run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /existing logical records changed/,
  );
  db.close();
});

test("preserves retained movement rows while adding school-admin repair indexes and leave-reference guards", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE leave_requests (id TEXT PRIMARY KEY);
    CREATE TABLE exit_permissions (
      id TEXT PRIMARY KEY,
      organizationId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      status TEXT NOT NULL,
      actualReturnAt TEXT,
      leaveRequestId TEXT,
      origin TEXT
    );
    INSERT INTO leave_requests VALUES ('leave-1');
    INSERT INTO exit_permissions VALUES ('exit-1', 'org-1', 'student-1', 'COMPLETED', '2026-01-01', 'leave-1', 'student_request');
  `);
  const before = inventory(db);
  db.exec(`
    CREATE INDEX IDX_exit_permissions_origin ON exit_permissions(origin);
    CREATE TRIGGER exit_leave_reference_insert
      BEFORE INSERT ON exit_permissions
      WHEN NEW.leaveRequestId IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM leave_requests WHERE id = NEW.leaveRequestId)
      BEGIN SELECT RAISE(ABORT, 'EXIT_LEAVE_REQUEST_NOT_FOUND'); END;
    CREATE TRIGGER exit_leave_reference_update
      BEFORE UPDATE OF leaveRequestId ON exit_permissions
      WHEN NEW.leaveRequestId IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM leave_requests WHERE id = NEW.leaveRequestId)
      BEGIN SELECT RAISE(ABORT, 'EXIT_LEAVE_REQUEST_NOT_FOUND'); END;
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  assert.throws(
    () =>
      db
        .prepare(
          "INSERT INTO exit_permissions VALUES ('exit-2', 'org-1', 'student-2', 'PENDING', NULL, 'missing', NULL)",
        )
        .run(),
    /EXIT_LEAVE_REQUEST_NOT_FOUND/,
  );
  assert.equal(
    db
      .prepare("SELECT leaveRequestId FROM exit_permissions WHERE id='exit-1'")
      .get().leaveRequestId,
    "leave-1",
  );
  db.close();
});

test("rejects an unrelated role-assignment removal or change", () => {
  const db = fixture();
  const before = inventory(db);
  db.prepare(
    "DELETE FROM user_role_assignments WHERE id='retained-admin'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db)),
    /outside the approved orphan repair/,
  );
  db.close();
});

test("supports generic SQLite snapshots without application tables", () => {
  const db = new Database(":memory:");
  db.exec("CREATE TABLE records (id TEXT PRIMARY KEY, value TEXT NOT NULL)");
  db.prepare("INSERT INTO records VALUES (?, ?)").run("record-1", "preserved");

  const before = inventory(db);
  assert.deepEqual(before.orphanedScopedRoleAssignmentIds, []);
  assert.doesNotThrow(() => preserved(before, inventory(db)));
  db.close();
});

test("preserves class records while applying the approved orphan-role repair", () => {
  const db = fixture();
  db.exec(`
    CREATE TABLE education_classes (id TEXT PRIMARY KEY, name TEXT);
    INSERT INTO education_classes VALUES ('class-1', 'Retained');
    CREATE TABLE migrations (id INTEGER PRIMARY KEY, name TEXT);
  `);
  const before = inventory(db);
  db.exec(`
    DELETE FROM user_role_assignments WHERE id='orphaned-student';
    ALTER TABLE education_classes ADD COLUMN academicYearId TEXT;
    INSERT INTO migrations(name) VALUES ('AcademicSchedulingFoundation1730900000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare("UPDATE education_classes SET name='changed'").run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /existing logical records changed/,
  );
  db.close();
});

test("rejects a missing role-assignment table even when every row is an approved orphan", () => {
  const db = fixture();
  db.prepare(
    "DELETE FROM user_role_assignments WHERE id='retained-admin'",
  ).run();
  const before = inventory(db);
  db.exec("DROP TABLE user_role_assignments");
  assert.throws(
    () => preserved(before, inventory(db), db),
    /table missing after migration/,
  );
  db.close();
});

for (const sql of [
  "DELETE FROM records WHERE rowid=1",
  "UPDATE records SET value='changed' WHERE rowid=1",
  "ALTER TABLE records DROP COLUMN value",
  "DROP TABLE records",
]) {
  test(`rejects original-record loss: ${sql}`, () => {
    const db = new Database(":memory:");
    db.exec(
      "CREATE TABLE records (value TEXT, optional TEXT); INSERT INTO records VALUES ('same',NULL),('same',NULL)",
    );
    const before = inventory(db);
    db.exec(sql);
    assert.throws(
      () => preserved(before, inventory(db), db),
      /Migration preservation failed/,
    );
    db.close();
  });
}

test("rejects undeclared schema additions to an empty table", () => {
  const db = new Database(":memory:");
  db.exec("CREATE TABLE records (value TEXT)");
  const before = inventory(db);
  db.exec("ALTER TABLE records ADD COLUMN surprise TEXT");
  assert.throws(
    () => preserved(before, inventory(db), db),
    /unexpected added column/,
  );
  db.close();
});

test("permits only the default group link created for legacy time blocks", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE school_schedule_time_blocks (id TEXT PRIMARY KEY, organizationId TEXT NOT NULL, partOfDay TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO school_schedule_time_blocks VALUES ('block-1', 'school-1', 'AM');
  `);
  const before = inventory(db);
  db.exec(`
    CREATE TABLE school_schedule_time_block_groups (id TEXT PRIMARY KEY, organizationId TEXT NOT NULL, name TEXT NOT NULL);
    INSERT INTO school_schedule_time_block_groups VALUES ('morning', 'school-1', 'صبح');
    ALTER TABLE school_schedule_time_blocks ADD COLUMN groupId TEXT;
    UPDATE school_schedule_time_blocks SET groupId='morning';
    INSERT INTO migrations VALUES ('SchoolScheduleTimeBlockGroups1762000000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare("UPDATE school_schedule_time_blocks SET groupId='unknown'").run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /unexpected default group/,
  );
  db.close();
});

test("permits only null subject and academic snapshots for existing attendance sessions", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE attendance_sessions (id TEXT PRIMARY KEY, sessionDate TEXT NOT NULL);
    INSERT INTO attendance_sessions VALUES ('session-1', '2026-10-17');
    CREATE TABLE migrations (name TEXT);
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE attendance_sessions ADD COLUMN subjectIdSnapshot varchar(120);
    ALTER TABLE attendance_sessions ADD COLUMN subjectNameSnapshot varchar(240);
    ALTER TABLE attendance_sessions ADD COLUMN academicYearIdSnapshot varchar(36);
    ALTER TABLE attendance_sessions ADD COLUMN academicYearNameSnapshot varchar(240);
    ALTER TABLE attendance_sessions ADD COLUMN termIdSnapshot varchar(36);
    ALTER TABLE attendance_sessions ADD COLUMN termNameSnapshot varchar(240);
    INSERT INTO migrations(name) VALUES
      ('AttendanceSubjectSnapshots1731200400000'),
      ('AttendanceAcademicSnapshots1731300100000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE attendance_sessions SET subjectIdSnapshot='math' WHERE id='session-1'",
  ).run();
  assert.throws(() => preserved(before, inventory(db), db), /non-null value/);
  db.close();
});

test("permits only declared announcement defaults for existing records", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE school_announcements (id TEXT PRIMARY KEY, title TEXT NOT NULL);
    INSERT INTO school_announcements VALUES ('announcement-1', 'Retained');
    CREATE TABLE migrations (name TEXT);
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE school_announcements ADD COLUMN category TEXT NOT NULL DEFAULT 'general';
    ALTER TABLE school_announcements ADD COLUMN linkUrl TEXT;
    ALTER TABLE school_announcements ADD COLUMN mediaUrl TEXT;
    ALTER TABLE school_announcements ADD COLUMN mediaType TEXT;
    INSERT INTO migrations(name) VALUES ('TargetedAnnouncementMedia1731500000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE school_announcements SET mediaUrl='https://invalid.example/media' WHERE id='announcement-1'",
  ).run();
  assert.throws(() => preserved(before, inventory(db), db), /non-null value/);
  db.close();
});

test("permits only the correction-review repair for a missing reviewer", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE attendance_corrections (id TEXT PRIMARY KEY, reviewedById TEXT, reason TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO users VALUES ('reviewer');
    INSERT INTO attendance_corrections VALUES ('orphaned', 'deleted-reviewer', 'legacy'), ('retained', 'reviewer', 'verified');
  `);
  const before = inventory(db);
  db.exec(`
    UPDATE attendance_corrections SET reviewedById=NULL WHERE id='orphaned';
    INSERT INTO migrations(name) VALUES ('AttendanceCorrectionReviewIntegrity1731300300000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE attendance_corrections SET reviewedById=NULL WHERE id='retained'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /existing logical records changed/,
  );
  db.close();
});

test("permits only the explicit automatic-to-all-session review-policy migration", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE attendance_policies (id TEXT PRIMARY KEY, principalReviewMode TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO attendance_policies VALUES ('legacy-policy', 'automatic'), ('absence-policy', 'absences_only');
  `);
  const before = inventory(db);
  db.exec(`
    UPDATE attendance_policies SET principalReviewMode='all_sessions' WHERE id='legacy-policy';
    INSERT INTO migrations(name) VALUES ('PrincipalAttendanceAllSessionsReview1762300600000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE attendance_policies SET principalReviewMode='all_sessions' WHERE id='absence-policy'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /existing logical records changed/,
  );
  db.close();
});

test("permits only the default/null principal-action columns on retained teacher reports", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE teacher_student_reports (id TEXT PRIMARY KEY, message TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO teacher_student_reports VALUES ('legacy-report', 'retain this report');
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE teacher_student_reports ADD COLUMN principalAction TEXT;
    ALTER TABLE teacher_student_reports ADD COLUMN principalActionNote TEXT NOT NULL DEFAULT '';
    ALTER TABLE teacher_student_reports ADD COLUMN principalActionAt TEXT;
    ALTER TABLE teacher_student_reports ADD COLUMN principalActionById TEXT;
    INSERT INTO migrations(name) VALUES ('TeacherStudentReportPrincipalActions1762301000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE teacher_student_reports SET principalAction='contact_request' WHERE id='legacy-report'",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /non-null value in principalAction/,
  );
  db.close();
});

test("preserves retained workflow rows while adding nullable return and academic-cycle provenance", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE teacher_leave_requests (id TEXT PRIMARY KEY, reason TEXT NOT NULL);
    CREATE TABLE school_schedule_entries (id TEXT PRIMARY KEY, title TEXT NOT NULL);
    CREATE TABLE school_schedule_occurrence_overrides (id TEXT PRIMARY KEY, entryId TEXT NOT NULL);
    CREATE TABLE attendance_sessions (id TEXT PRIMARY KEY, title TEXT NOT NULL);
    CREATE TABLE teacher_student_reports (id TEXT PRIMARY KEY, message TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO teacher_leave_requests VALUES ('leave-1', 'Retained leave');
    INSERT INTO school_schedule_entries VALUES ('entry-1', 'Retained lesson');
    INSERT INTO school_schedule_occurrence_overrides VALUES ('override-1', 'entry-1');
    INSERT INTO attendance_sessions VALUES ('session-1', 'Retained attendance');
    INSERT INTO teacher_student_reports VALUES ('report-1', 'Retained report');
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE teacher_leave_requests ADD COLUMN returnDate TEXT;
    ALTER TABLE teacher_leave_requests ADD COLUMN returnMessage TEXT;
    ALTER TABLE teacher_leave_requests ADD COLUMN returnStatus TEXT;
    ALTER TABLE teacher_leave_requests ADD COLUMN returnRequestedAt TEXT;
    ALTER TABLE teacher_leave_requests ADD COLUMN returnReviewedAt TEXT;
    ALTER TABLE teacher_leave_requests ADD COLUMN academicCycleSnapshots TEXT;
    ALTER TABLE school_schedule_occurrence_overrides ADD COLUMN leaveRequestId TEXT;
    ALTER TABLE school_schedule_entries ADD COLUMN academicYearId TEXT;
    ALTER TABLE school_schedule_entries ADD COLUMN termId TEXT;
    ALTER TABLE school_schedule_entries ADD COLUMN academicYearNameSnapshot TEXT;
    ALTER TABLE school_schedule_entries ADD COLUMN termNameSnapshot TEXT;
    ALTER TABLE school_schedule_entries ADD COLUMN previousTeacherNameSnapshot TEXT;
    ALTER TABLE school_schedule_entries ADD COLUMN teacherChangedAt TEXT;
    ALTER TABLE attendance_sessions ADD COLUMN historicalImportReason TEXT;
    ALTER TABLE teacher_student_reports ADD COLUMN academicYearIdSnapshot TEXT;
    ALTER TABLE teacher_student_reports ADD COLUMN academicYearNameSnapshot TEXT;
    ALTER TABLE teacher_student_reports ADD COLUMN termIdSnapshot TEXT;
    ALTER TABLE teacher_student_reports ADD COLUMN termNameSnapshot TEXT;
    INSERT INTO migrations VALUES
      ('TeacherLeaveEarlyReturn1762200000000'),
      ('LegacyScheduleAcademicCycles1762300000000'),
      ('AttendanceHistoricalImportReason1762300200000'),
      ('TeacherStudentReportAcademicSnapshots1762300300000'),
      ('LegacyScheduleAcademicNameSnapshots1762300400000'),
      ('TeacherLeaveAcademicCycleSnapshots1762300500000'),
      ('ScheduleTeacherChangeMarker1763100000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare("UPDATE teacher_leave_requests SET returnDate='2026-01-01'").run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /non-null value in returnDate/,
  );
  db.close();
});

test("keeps existing notification and movement rows at their migration defaults", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE notification_preferences (id TEXT PRIMARY KEY, userId TEXT NOT NULL);
    CREATE TABLE exit_permissions (id TEXT PRIMARY KEY, status TEXT NOT NULL);
    CREATE TABLE migrations (name TEXT);
    INSERT INTO notification_preferences VALUES ('preference-1', 'user-1');
    INSERT INTO exit_permissions VALUES ('exit-1', 'APPROVED');
  `);
  const before = inventory(db);
  db.exec(`
    ALTER TABLE notification_preferences ADD COLUMN autoDeleteEnabled boolean NOT NULL DEFAULT 0;
    ALTER TABLE notification_preferences ADD COLUMN autoDeleteAfterHours integer NOT NULL DEFAULT 24;
    ALTER TABLE exit_permissions ADD COLUMN leaveRequestId TEXT;
    ALTER TABLE exit_permissions ADD COLUMN resolution TEXT;
    INSERT INTO migrations VALUES
      ('NotificationAutoDeletePreferences1763300000000'),
      ('StudentMovementCenter1763600000000');
  `);
  assert.doesNotThrow(() => preserved(before, inventory(db), db));
  db.prepare(
    "UPDATE notification_preferences SET autoDeleteAfterHours=72",
  ).run();
  assert.throws(
    () => preserved(before, inventory(db), db),
    /non-default value in autoDeleteAfterHours/,
  );
  db.close();
});

for (const sql of [
  "ALTER TABLE education_classes ADD COLUMN academicYearId TEXT DEFAULT 'unexpected'",
  "ALTER TABLE education_classes ADD COLUMN academicYearId TEXT; UPDATE education_classes SET academicYearId='unexpected'",
]) {
  test(`rejects invalid values for an approved column: ${sql}`, () => {
    const db = new Database(":memory:");
    db.exec(
      "CREATE TABLE education_classes (id TEXT); INSERT INTO education_classes VALUES ('class'); CREATE TABLE migrations (name TEXT)",
    );
    const before = inventory(db);
    db.exec(sql);
    db.exec(
      "INSERT INTO migrations VALUES ('AcademicSchedulingFoundation1730900000000')",
    );
    assert.throws(() => preserved(before, inventory(db), db), /non-null value/);
    db.close();
  });
}
