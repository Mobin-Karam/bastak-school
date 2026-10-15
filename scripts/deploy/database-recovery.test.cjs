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

test("permits only the migration's orphaned scoped-role deletion", () => {
  const db = fixture();
  const before = inventory(db);
  db.prepare("DELETE FROM user_role_assignments WHERE id='orphaned-student'").run();
  assert.doesNotThrow(() => preserved(before, inventory(db)));
  db.close();
});

test("rejects an unrelated role-assignment removal or change", () => {
  const db = fixture();
  const before = inventory(db);
  db.prepare("DELETE FROM user_role_assignments WHERE id='retained-admin'").run();
  assert.throws(() => preserved(before, inventory(db)), /outside the approved orphan repair/);
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
  assert.throws(() => preserved(before, inventory(db), db), /existing logical records changed/);
  db.close();
});

test("rejects a missing role-assignment table even when every row is an approved orphan", () => {
  const db = fixture();
  db.prepare("DELETE FROM user_role_assignments WHERE id='retained-admin'").run();
  const before = inventory(db);
  db.exec("DROP TABLE user_role_assignments");
  assert.throws(() => preserved(before, inventory(db), db), /table missing after migration/);
  db.close();
});
