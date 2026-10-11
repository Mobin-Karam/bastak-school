import "reflect-metadata";
import { DataSource } from "typeorm";
import { AttendanceDelegatesAndPools1730400000000 } from "../src/database/migrations/1730400000000-AttendanceDelegatesAndPools";

describe("attendance operations additive migration (SQLite)", () => {
  let db: DataSource;
  const migration = new AttendanceDelegatesAndPools1730400000000();
  beforeEach(async () => {
    db = await new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
    }).initialize();
    for (const table of [
      "organizations",
      "users",
      "students",
      "dorm_rooms",
      "attendance_sessions",
    ])
      await db.query(`CREATE TABLE ${table}(id varchar PRIMARY KEY)`);
    await db.query(
      "INSERT INTO attendance_sessions VALUES('historical-session')",
    );
  });
  afterEach(async () => {
    await db.destroy();
  });
  it("preserves history and safely reverses an unused schema", async () => {
    const q = db.createQueryRunner();
    await migration.up(q);
    expect(await db.query("SELECT id FROM attendance_sessions")).toEqual([
      { id: "historical-session" },
    ]);
    await migration.down(q);
    expect(await db.query("SELECT id FROM attendance_sessions")).toHaveLength(
      1,
    );
    await q.release();
  });
  it("enforces room uniqueness, date ordering, foreign keys, and refuses data-losing rollback", async () => {
    const q = db.createQueryRunner();
    await migration.up(q);
    for (const [table, id] of [
      ["organizations", "org"],
      ["users", "staff"],
      ["students", "student"],
      ["dorm_rooms", "room"],
    ])
      await db.query(`INSERT INTO ${table} VALUES(?)`, [id]);
    const sql =
      "INSERT INTO dorm_attendance_delegates(id,organizationId,roomId,studentId,startsOn,endsOn) VALUES(?,'org','room','student',?,?)";
    await expect(
      db.query(sql, ["invalid", "2026-10-12", "2026-10-11"]),
    ).rejects.toThrow();
    await db.query(sql, ["delegate", "2026-10-11", "2026-10-12"]);
    await expect(
      db.query(sql, ["duplicate", "2026-10-11", "2026-10-12"]),
    ).rejects.toThrow();
    await expect(
      db.query(
        "INSERT INTO attendance_pools(id,organizationId,sessionId,place,endsAt) VALUES('pool','org','missing','Hall',datetime('now'))",
      ),
    ).rejects.toThrow();
    await expect(migration.down(q)).rejects.toThrow("saved data");
    expect(
      await db.query("SELECT id FROM dorm_attendance_delegates"),
    ).toHaveLength(1);
    await q.release();
  });
});
