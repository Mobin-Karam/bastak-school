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
