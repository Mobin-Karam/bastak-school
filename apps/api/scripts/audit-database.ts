/** Only disposable synthetic databases. Never accepts a database path or reads application config. */
import "reflect-metadata";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import Database from "better-sqlite3";
import { DataSource, SelectQueryBuilder, ObjectLiteral } from "typeorm";
import * as entities from "../src/database/entities";
import { AttendanceRecord } from "../src/database/entities/attendance-record.entity";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
import { DormRoom } from "../src/database/entities/dorm-room.entity";
import { DormRoomAssignment } from "../src/database/entities/dorm-room-assignment.entity";
import { EducationClassEnrollment } from "../src/database/entities/education-class-enrollment.entity";
import { Student } from "../src/database/entities/student.entity";
import { DormitoryService } from "../src/modules/dormitory/dormitory.service";
import { SchoolAccessService } from "../src/modules/school-access/school-access.service";

const baselineTimestamp = 1730700000000;
const migrations = fs.readdirSync(path.resolve(__dirname, "../src/database/migrations"))
  .filter((file) => file.endsWith(".ts"));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "bastak-db-audit-"));
const filename = path.join(root, "synthetic.sqlite");
const samples = 40;
const upgraded = process.argv.includes("--upgraded");

function source(database: string, current = false) {
  return new DataSource({
    type: "better-sqlite3", database,
    entities: Object.values(entities).filter((value) => typeof value === "function"),
    migrations: migrations.filter((file) => current || Number(file.slice(0, 13)) <= baselineTimestamp)
      .map((file) => path.resolve(__dirname, "../src/database/migrations", file)),
    synchronize: false, migrationsRun: true, migrationsTransactionMode: "each",
    prepareDatabase: (db) => { db.pragma("foreign_keys = ON"); db.pragma("journal_mode = WAL"); },
  });
}

async function inventory(db: DataSource) {
  const tables: { name: string; sql: string }[] = await db.query(
    "SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  return Promise.all(tables.map(async ({ name, sql }) => {
    const quoted = name.replace(/"/g, '""');
    const indexes: { name: string; unique: number; partial: number }[] = await db.query(`PRAGMA index_list("${quoted}")`);
    const metadata = db.entityMetadatas.find((entity) => entity.tableName === name);
    const expectedUniqueKeys = metadata ? [
      ...metadata.uniques.map((unique) => unique.columns.map((column) => column.databaseName)),
      ...metadata.indices.filter((index) => index.isUnique).map((index) => index.columns.map((column) => column.databaseName)),
    ] : [];
    const actualIndexes = await Promise.all(indexes.map(async (index) => ({
      ...index, columns: (await db.query(`PRAGMA index_info("${index.name.replace(/"/g, '""')}")`)).map((column: {name: string}) => column.name),
    })));
    const foreignKeys: { from: string; table: string; to: string; on_delete: string }[] = await db.query(`PRAGMA foreign_key_list("${quoted}")`);
    return {
      table: name, ddl: sql,
      columns: await db.query(`PRAGMA table_info("${quoted}")`),
      foreignKeys,
      indexes: actualIndexes,
      entity: metadata?.targetName,
      missingEntityUniqueKeys: expectedUniqueKeys.filter((columns) => !actualIndexes.some((index) => index.unique && JSON.stringify(index.columns) === JSON.stringify(columns))),
      missingEntityForeignKeys: metadata?.foreignKeys.flatMap((key) => key.columns.map((column, index) => ({
        from: column.databaseName, table: key.referencedTablePath, to: key.referencedColumns[index].databaseName,
        onDelete: key.onDelete ?? "NO ACTION",
      }))).filter((key) => !foreignKeys.some((actual) => actual.from === key.from && actual.table === key.table && actual.to === key.to && actual.on_delete === key.onDelete)) ?? [],
      hasCheckConstraint: /\bCHECK\s*\(/i.test(sql),
      triggers: await db.query("SELECT name,sql FROM sqlite_master WHERE type='trigger' AND tbl_name=? ORDER BY name", [name]),
    };
  }));
}

async function seed(db: DataSource) {
  // Bulk fixture loading is a single transaction; no auth accounts or credentials are needed.
  const native = (db.driver as unknown as { databaseConnection: Database.Database }).databaseConnection;
  native.transaction(() => {
    const school = native.prepare("INSERT INTO organizations(id,name,type) VALUES(?,?,'SCHOOL')");
    const student = native.prepare("INSERT INTO students(id,name,organizationId,gradeId,educationTypeId,trackId) VALUES(?,?,?,1,'school','general')");
    const classroom = native.prepare("INSERT INTO education_classes(id,organizationId,code,name,schoolYear,gradeId,educationTypeId,trackId) VALUES(?,?,?,?, '1405-1406',1,'school','general')");
    const enrollment = native.prepare("INSERT INTO education_class_enrollments(id,classroomId,studentId) VALUES(?,?,?)");
    const room = native.prepare("INSERT INTO dorm_rooms(id,organizationId,code,name,capacity) VALUES(?,?,?,?,12)");
    const placement = native.prepare("INSERT INTO dorm_room_assignments(id,roomId,studentId) VALUES(?,?,?)");
    const session = native.prepare("INSERT INTO attendance_sessions(id,organizationId,contextType,contextId,sessionDate) VALUES(?,?,'class',?,'2026-10-01 08:00:00')");
    const mark = native.prepare("INSERT INTO attendance_records(id,sessionId,studentId,status) VALUES(?,?,?,'present')");
    for (let schoolIndex = 0; schoolIndex < 10; schoolIndex++) {
      const org = `school-${schoolIndex}`;
      school.run(org, `Synthetic school ${schoolIndex}`);
      for (let i = 0; i < 3000; i++) student.run(`${org}-student-${i}`, `Synthetic student ${i}`, org);
      for (let i = 0; i < 100; i++) {
        const cls = `${org}-class-${i}`;
        classroom.run(cls, org, `class-${i}`, `Synthetic class ${i}`);
        for (let j = 0; j < 30; j++) enrollment.run(`${cls}-${j}`, cls, `${org}-student-${i * 30 + j}`);
        for (let occurrence = 0; occurrence < 4; occurrence++) {
          const ses = `${org}-session-${i}-${occurrence}`;
          session.run(ses, org, cls);
          for (let j = 0; j < 30; j++) mark.run(`${ses}-${j}`, ses, `${org}-student-${i * 30 + j}`);
        }
      }
      for (let i = 0; i < 200; i++) {
        const rm = `${org}-room-${i}`;
        room.run(rm, org, `room-${i}`, `Synthetic room ${i}`);
        for (let j = 0; j < 12; j++) placement.run(`${rm}-${j}`, rm, `${org}-student-${i * 12 + j}`);
      }
    }
  })();
}

async function measure(name: string, run: () => Promise<unknown>, plan?: SelectQueryBuilder<ObjectLiteral>) {
  for (let i = 0; i < 5; i++) await run();
  const times: number[] = [];
  for (let i = 0; i < samples; i++) {
    const start = performance.now(); await run(); times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const sql = plan?.getQueryAndParameters();
  return { name, medianMs: times[Math.floor(times.length / 2)], p95Ms: times[Math.ceil(times.length * 0.95) - 1],
    sql: sql?.[0], plan: sql ? await plan!.connection.query(`EXPLAIN QUERY PLAN ${sql[0]}`, sql[1]) : undefined };
}

async function queries(db: DataSource) {
  const id = "school-0-student-0";
  const marks = db.getRepository(AttendanceRecord).createQueryBuilder("record")
    .leftJoinAndSelect("record.session", "session").leftJoinAndSelect("session.organization", "organization")
    .where("record.studentId = :id", { id }).orderBy("record.createdAt", "DESC");
  const sessions = db.getRepository(AttendanceSession).createQueryBuilder("session")
    .where("session.organizationId = :org", { org: "school-0" }).orderBy("session.sessionDate", "DESC");
  const enrollments = db.getRepository(EducationClassEnrollment).createQueryBuilder("enrollment")
    .where("enrollment.studentId = :id", { id });
  const placements = db.getRepository(DormRoomAssignment).createQueryBuilder("assignment")
    .leftJoinAndSelect("assignment.room", "room").leftJoinAndSelect("room.organization", "organization")
    .leftJoinAndSelect("assignment.student", "student").where("assignment.studentId = :id", { id });
  const students = db.getRepository(Student).createQueryBuilder("student")
    .leftJoinAndSelect("student.organization", "organization").leftJoinAndSelect("student.user", "user")
    .where("student.organizationId = :org", { org: "school-0" }).orderBy("student.createdAt", "DESC");
  const rooms = db.getRepository(DormRoom).createQueryBuilder("room")
    .leftJoinAndSelect("room.organization", "organization").leftJoinAndSelect("room.assignments", "assignment")
    .leftJoinAndSelect("assignment.student", "student").where("room.organizationId = :org", { org: "school-0" })
    .orderBy("room.name", "ASC");
  return [
    await measure("attendance-student-summary-query", () => marks.getMany(), marks),
    await measure("attendance-school-session-list-query", () => sessions.getMany(), sessions),
    await measure("student-class-enrollment-query", () => enrollments.getMany(), enrollments),
    await measure("dorm-current-placement-query", () => placements.getMany(), placements),
    await measure("registration-student-list-query", () => students.getMany(), students),
    await measure("dorm-room-list-hydration", () => rooms.getMany(), rooms),
  ];
}

async function restoreDrill(db: DataSource) {
  const snapshot = path.join(root, "backup.sqlite");
  const restored = path.join(root, "restored.sqlite");
  const native = (db.driver as unknown as { databaseConnection: Database.Database }).databaseConnection;
  await native.backup(snapshot);
  fs.copyFileSync(snapshot, restored);
  const copy = new Database(restored, { readonly: true, fileMustExist: true });
  try {
    assert.equal(copy.pragma("integrity_check", { simple: true }), "ok");
    assert.deepEqual(copy.pragma("foreign_key_check"), []);
    const tables = native.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[];
    let rows = 0;
    for (const { name } of tables) {
      const quoted = name.replace(/"/g, '""');
      const original = native.prepare(`SELECT * FROM "${quoted}" ORDER BY rowid`).all();
      assert.deepEqual(copy.prepare(`SELECT * FROM "${quoted}" ORDER BY rowid`).all(), original);
      rows += original.length;
    }
    assert.deepEqual(copy.prepare("SELECT type,name,sql FROM sqlite_master ORDER BY type,name").all(),
      native.prepare("SELECT type,name,sql FROM sqlite_master ORDER BY type,name").all());
    return { verified: true, tables: tables.length, rows, checks: ["integrity_check", "foreign_key_check", "all rows", "schema objects"] };
  } finally { copy.close(); }
}

async function main() {
  let db = source(filename);
  try {
    await db.initialize(); await seed(db);
    const baseline = await queries(db);
    const backupRestore = await restoreDrill(db);
    const beforeInventory = await inventory(db);
    let after: unknown;
    if (upgraded) {
      await db.destroy(); db = source(filename, true); await db.initialize();
      const saved = new Database(path.join(root, "backup.sqlite"), { readonly: true });
      let preservedRows = 0;
      try {
        for (const table of beforeInventory) {
          if (table.table === "migrations") continue; // The upgrade appends its migration receipt only.
          const sql = `SELECT * FROM "${table.table.replace(/"/g, '""')}" ORDER BY rowid`;
          const before = saved.prepare(sql).all();
          assert.deepEqual(await db.query(sql), before);
          preservedRows += before.length;
        }
      } finally { saved.close(); }
      const access = { scopedOrganizationIds: async () => ["school-0"] } as unknown as SchoolAccessService;
      const service = new DormitoryService(db.getRepository(DormRoom), db.getRepository(DormRoomAssignment), db.getRepository(Student), access, {} as never);
      const queryLog = db.logger.logQuery;
      let lastQuery: { sql: string; parameters?: unknown[] } | undefined;
      db.logger.logQuery = (sql, parameters) => { lastQuery = { sql, parameters }; };
      let roomService;
      try { roomService = await measure("dorm-room-list-service", () => service.listRooms({} as never)); }
      finally { db.logger.logQuery = queryLog; }
      const servicePlan = lastQuery ? await db.query(`EXPLAIN QUERY PLAN ${lastQuery.sql}`, lastQuery.parameters) : [];
      after = { queries: await queries(db), roomService: { ...roomService, sql: lastQuery?.sql, plan: servicePlan },
        schema: await inventory(db), preservedRows, foreignKeyCheck: await db.query("PRAGMA foreign_key_check") };
    }
    console.log(JSON.stringify({ auditedBaselineCommit: "fce04c6", beforeSchemaVersion: baselineTimestamp,
      baselineNote: "Historical chain through 1730700000000 uses the pending NightAttendance safety correction in both phases; original pre-change measurements are separately recorded in the report.", node: process.version,
      sqlite: (await db.query("SELECT sqlite_version() version"))[0].version,
      fixture: { schools: 10, students: 30000, classes: 1000, enrollments: 30000, rooms: 2000, placements: 24000, attendanceSessions: 4000, attendanceRecords: 120000 },
      methodology: { samples, warmup: 5, concurrency: 1, cache: "warm", timing: "TypeORM query plus hydration; synthetic data, not production" },
      baseline, backupRestore, beforeInventory, after }, null, 2));
  } finally {
    if (db.isInitialized) await db.destroy();
    fs.rmSync(root, { recursive: true, force: true });
  }
}
void main().catch((error) => { console.error(error instanceof Error ? error.message : "Audit failed"); process.exitCode = 1; });
