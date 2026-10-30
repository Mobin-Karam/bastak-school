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
