import "reflect-metadata";
import { DataSource, QueryRunner } from "typeorm";
import { AttendanceSessionLifecycle1730200000000 } from "../src/database/migrations/1730200000000-AttendanceSessionLifecycle";

// Start with the previous schema: synchronize cannot prove migration compatibility.
describe("Attendance lifecycle migration (real SQLite)", () => {
  let db: DataSource;
  let q: QueryRunner;
  const migration = new AttendanceSessionLifecycle1730200000000();
  beforeEach(async () => {
    db = await new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
    }).initialize();
    q = db.createQueryRunner();
    for (const sql of [
      "CREATE TABLE organizations(id varchar PRIMARY KEY)",
      "CREATE TABLE users(id varchar PRIMARY KEY)",
      "CREATE TABLE roles(id varchar PRIMARY KEY, code varchar UNIQUE)",
      "CREATE TABLE permissions(id varchar PRIMARY KEY, code varchar UNIQUE, description varchar)",
      "CREATE TABLE role_permissions(id varchar PRIMARY KEY, roleId varchar, permissionId varchar, UNIQUE(roleId,permissionId))",
      "CREATE TABLE attendance_sessions(id varchar PRIMARY KEY, organizationId varchar, contextType varchar, contextId varchar, sessionDate datetime, note text)",
      "CREATE TABLE attendance_records(id varchar PRIMARY KEY, sessionId varchar, studentId varchar, status varchar, reviewStatus varchar, note text)",
      "INSERT INTO organizations VALUES('school-a'),('school-b')",
      "INSERT INTO users VALUES('teacher-a')",
      "INSERT INTO roles VALUES('principal','PRINCIPAL'),('teacher','TEACHER'),('student','STUDENT')",
      "INSERT INTO attendance_sessions VALUES('old','school-a','class','class-a','2026-10-11 08:00:00','Original note'),('empty','school-a','dorm','room-a','2026-10-11 21:00:00','')",
    ])
      await q.query(sql);
    for (const [id, status, review] of [
      ["present", "present", null],
      ["absent", "absent", "pending"],
      ["late", "late", null],
      ["approved", "excused", "approved"],
      ["unreviewed", "excused", null],
      ["rejected", "excused", "rejected"],
    ])
      await q.query(
        "INSERT INTO attendance_records VALUES(?,'old',?,?,?,'Original reason')",
        [id, id, status, review],
      );
  });
  afterEach(async () => {
    await q.release();
    await db.destroy();
  });
  it("preserves legacy marks and separates evidenced absence from uncertain excuses", async () => {
    await migration.up(q);
    const rows = await q.query(
      "SELECT id,status,physicalStatus,reviewStatus,note,revision FROM attendance_records ORDER BY id",
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "present",
          status: "present",
          physicalStatus: "present",
        }),
        expect.objectContaining({
          id: "absent",
          status: "absent",
          physicalStatus: "absent",
        }),
        expect.objectContaining({
          id: "late",
          status: "late",
          physicalStatus: "late",
        }),
        expect.objectContaining({
          id: "approved",
          status: "excused",
          physicalStatus: "absent",
          reviewStatus: "approved",
        }),
        expect.objectContaining({
          id: "unreviewed",
          status: "excused",
          physicalStatus: "legacy_unknown",
        }),
        expect.objectContaining({
          id: "rejected",
          status: "excused",
          physicalStatus: "legacy_unknown",
          reviewStatus: "rejected",
        }),
      ]),
    );
    expect(rows).toHaveLength(6);
    expect(
      rows.every(
        (r: { note: string; revision: number }) =>
          r.note === "Original reason" && r.revision === 0,
      ),
    ).toBe(true);
  });
  it("retains sessions without inventing historical rosters or dates", async () => {
    await migration.up(q);
    expect(
      await q.query(
        "SELECT id,status,rosterSnapshot,operationalDate,occurrenceKey,submittedAt,rosterCapturedAt FROM attendance_sessions ORDER BY id",
      ),
    ).toEqual([
      {
        id: "empty",
        status: "open",
        rosterSnapshot: null,
        operationalDate: null,
        occurrenceKey: null,
        submittedAt: null,
        rosterCapturedAt: null,
      },
      {
        id: "old",
        status: "submitted",
        rosterSnapshot: null,
        operationalDate: null,
        occurrenceKey: null,
        submittedAt: null,
        rosterCapturedAt: null,
      },
    ]);
    expect(
      (
        await q.query(
          "SELECT note,sessionDate FROM attendance_sessions WHERE id='old'",
        )
      )[0],
    ).toEqual({ note: "Original note", sessionDate: "2026-10-11 08:00:00" });
  });
  it("enforces school-scoped occurrences while allowing legacy null identities", async () => {
    await migration.up(q);
    await q.query(
      "UPDATE attendance_sessions SET occurrenceKey='class_schedule:slot:2026-10-11' WHERE id='old'",
    );
    await expect(
      q.query(
        "UPDATE attendance_sessions SET occurrenceKey='class_schedule:slot:2026-10-11' WHERE id='empty'",
      ),
    ).rejects.toThrow(/UNIQUE/);
    await q.query(
      "INSERT INTO attendance_sessions(id,organizationId,occurrenceKey) VALUES('foreign','school-b','class_schedule:slot:2026-10-11'),('legacy','school-a',NULL)",
    );
    expect(
      (await q.query("SELECT count(*) n FROM attendance_sessions"))[0].n,
    ).toBe(4);
  });
  it("uses school policy defaults and retains snapshots after staff deletion", async () => {
    await migration.up(q);
    await q.query(
      "INSERT INTO attendance_policies(id,organizationId) VALUES('policy','school-a')",
    );
    expect(
      (
        await q.query(
          "SELECT timeZone,dayStartsAt,allowPartialSubmission,lateCountsAsPresent FROM attendance_policies",
        )
      )[0],
    ).toEqual({
      timeZone: "Asia/Tehran",
      dayStartsAt: "04:00",
      allowPartialSubmission: 1,
      lateCountsAsPresent: 1,
    });
    await expect(
      q.query(
        "INSERT INTO attendance_policies(id,organizationId) VALUES('other','school-a')",
      ),
    ).rejects.toThrow(/UNIQUE/);
    await q.query(
      "UPDATE attendance_sessions SET assignedStaffId='teacher-a',submittedById='teacher-a',assignedStaffNameSnapshot='Recorded staff' WHERE id='old'",
    );
    await q.query("DELETE FROM users WHERE id='teacher-a'");
    expect(
      (
        await q.query(
          "SELECT assignedStaffId,submittedById,assignedStaffNameSnapshot FROM attendance_sessions WHERE id='old'",
        )
      )[0],
    ).toEqual({
      assignedStaffId: null,
      submittedById: null,
      assignedStaffNameSnapshot: "Recorded staff",
    });
  });
  it("grants workflow permissions without letting students mark or review", async () => {
    await migration.up(q);
    const rows = await q.query(
      "SELECT r.code role,p.code permission FROM role_permissions rp JOIN roles r ON r.id=rp.roleId JOIN permissions p ON p.id=rp.permissionId ORDER BY role,permission",
    );
    expect(rows.filter((p: { role: string }) => p.role === "STUDENT")).toEqual([
      { role: "STUDENT", permission: "attendance.self.request" },
    ]);
    expect(rows.filter((p: { role: string }) => p.role === "TEACHER")).toEqual([
      { role: "TEACHER", permission: "attendance.reports.read" },
    ]);
    expect(
      rows.filter((p: { role: string }) => p.role === "PRINCIPAL"),
    ).toHaveLength(4);
  });
  it("refuses destructive rollback and preserves all existing attendance", async () => {
    await migration.up(q);
    await expect(migration.down()).rejects.toThrow(/forward-only/);
    expect(
      (await q.query("SELECT count(*) n FROM attendance_records"))[0].n,
    ).toBe(6);
  });
});
