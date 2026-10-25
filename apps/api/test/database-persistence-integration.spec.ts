import "reflect-metadata";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { DataSource } from "typeorm";
import * as entities from "../src/database/entities";
import { PersistenceUniquenessAndReadIndexes1730800000000 } from "../src/database/migrations/1730800000000-PersistenceUniquenessAndReadIndexes";
import { AcademicSchedulingFoundation1730900000000 } from "../src/database/migrations/1730900000000-AcademicSchedulingFoundation";
import { NightAttendance1728234800000 } from "../src/database/migrations/1728234800000-NightAttendance";
import {
  Organization,
  OrganizationStatus,
  OrganizationType,
} from "../src/database/entities/organization.entity";
import { OrganizationMembership } from "../src/database/entities/organization-membership.entity";
import { Student } from "../src/database/entities/student.entity";
import { User, UserRole } from "../src/database/entities/user.entity";
import { EducationClass } from "../src/database/entities/education-class.entity";
import { EducationClassEnrollment } from "../src/database/entities/education-class-enrollment.entity";
import { StudyGroup } from "../src/database/entities/study-group.entity";
import { StudyGroupMembership } from "../src/database/entities/study-group-membership.entity";
import { DormRoom } from "../src/database/entities/dorm-room.entity";
import { DormRoomAssignment } from "../src/database/entities/dorm-room-assignment.entity";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
import { AttendanceRecord } from "../src/database/entities/attendance-record.entity";
import { AttendanceWriteReceipt } from "../src/database/entities/attendance-write-receipt.entity";
import { DormitoryService } from "../src/modules/dormitory/dormitory.service";
import { SchoolAccessService } from "../src/modules/school-access/school-access.service";
import { AttendanceService } from "../src/modules/attendance/attendance.service";
import { RealtimeService } from "../src/modules/realtime/realtime.service";
import { SystemService } from "../src/modules/system/system.service";
import { AppVersion } from "../src/database/entities/app-version.entity";
import { AppRelease } from "../src/database/entities/app-release.entity";
import { AuditLog } from "../src/database/entities/audit-log.entity";
import { WorkflowsService } from "../src/modules/workflows/workflows.service";
import { LeaveRequest } from "../src/database/entities/leave-request.entity";
import { ExitPermission } from "../src/database/entities/exit-permission.entity";
import { RequestLetter } from "../src/database/entities/request-letter.entity";
import { ScheduleService } from "../src/modules/schedule/schedule.service";
import { AuthorizationService } from "../src/modules/authorization";
import { UserRoleAssignment } from "../src/database/entities/user-role-assignment.entity";
import { UserRelationship } from "../src/database/entities/user-relationship.entity";
import { SchoolScheduleEntry } from "../src/database/entities/school-schedule-entry.entity";
import { SchoolScheduleTimeBlock } from "../src/database/entities/school-schedule-time-block.entity";
import { SchoolScheduleTemplate } from "../src/database/entities/school-schedule-template.entity";
import { EducationClassBook } from "../src/database/entities/education-class-book.entity";
import { EducationBook } from "../src/database/entities/education-book.entity";
import { StudentPresence } from "../src/database/entities/student-presence.entity";
import { Plan } from "../src/database/entities/plan.entity";
import { Task, TaskType } from "../src/database/entities/task.entity";
import type { AuthenticatedUser } from "../src/modules/auth";

// All files live under a fresh OS temp directory; application data-source/config is never imported.
function database(filename: string, baseline = false, runMigrations = true) {
  const directory = path.resolve(__dirname, "../src/database/migrations");
  return new DataSource({
    type: "better-sqlite3",
    database: filename,
    entities: Object.values(entities).filter(
      (value) => typeof value === "function",
    ),
    migrations: fs
      .readdirSync(directory)
      .filter(
        (file) =>
          file.endsWith(".ts") &&
          (!baseline ||
            Number(file.slice(0, 13)) <= 1730700000000 ||
            file === "1731200400000-AttendanceSubjectSnapshots.ts" ||
            file === "1731300000000-AttendanceCorrectionReview.ts" ||
            file === "1731300100000-AttendanceAcademicSnapshots.ts" ||
            file === "1731400000000-StudentAttendancePoints.ts" ||
            file === "1731400100000-StudentPointLedgerIdempotencyScope.ts" ||
            file === "1731900000000-RewardsLedgerExtraction.ts" ||
            file === "1731800300000-StudentAccountChangeLimits.ts"),
      )
      .map((file) => path.join(directory, file)),
    synchronize: false,
    migrationsRun: runMigrations,
    migrationsTransactionMode: "each",
    prepareDatabase: (native) => {
      native.pragma("foreign_keys = ON");
      native.pragma("journal_mode = WAL");
      native.pragma("busy_timeout = 5000");
    },
  });
}

describe("migration-backed persistence and verified recovery (disposable SQLite files)", () => {
  let root: string, db: DataSource;
  let actor: AuthenticatedUser, a: Organization, b: Organization;
  let student: Student,
    foreignStudent: Student,
    room: DormRoom,
    otherRoom: DormRoom;
  let classroom: EducationClass, session: AttendanceSession;
  let access: SchoolAccessService;
  const migration = new PersistenceUniquenessAndReadIndexes1730800000000();

  beforeEach(async () => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "bastak-persistence-test-"));
    db = await database(path.join(root, "database.sqlite"), true).initialize();
    [a, b] = await db.getRepository(Organization).save([
      { name: "School A", type: OrganizationType.SCHOOL },
      { name: "School B", type: OrganizationType.SCHOOL },
    ]);
    const user = await db.getRepository(User).save({
      username: randomUUID(),
      role: UserRole.TEACHER,
      passwordHash: "unused-test-fixture",
    });
    await db.getRepository(OrganizationMembership).save([
      { user, organization: a },
      { user, organization: b },
    ]);
    actor = {
      id: user.id,
      username: user.username,
      role: "PRINCIPAL",
      roles: ["PRINCIPAL"],
      capabilities: ["attendance.read", "attendance.manage"],
      organizationIds: [a.id],
      activeOrganizationId: a.id,
      sessionId: randomUUID(),
    };
    [student, foreignStudent] = await db.getRepository(Student).save([
      { name: "Local", organization: a },
      { name: "Foreign", organization: b },
    ]);
    [room, otherRoom] = await db.getRepository(DormRoom).save([
      { organization: a, code: "a", name: "A", capacity: 2 },
      { organization: a, code: "b", name: "B", capacity: 2 },
    ]);
    // This fixture models the schema before pending migrations, so use its
    // historical column list rather than today's entity insertion metadata.
    classroom = db.getRepository(EducationClass).create({
      id: randomUUID(),
      organization: a,
      code: "a",
      name: "Class A",
      schoolYear: "1405-1406",
      gradeId: 1,
      educationTypeId: "school",
      trackId: "general",
    });
    await db.query(
      `INSERT INTO education_classes(id,organizationId,code,name,schoolYear,gradeId,educationTypeId,trackId) VALUES(?,?,?,?,?,?,?,?)`,
      [
        classroom.id,
        a.id,
        classroom.code,
        classroom.name,
        classroom.schoolYear,
        classroom.gradeId,
        classroom.educationTypeId,
        classroom.trackId,
      ],
    );
    await db
      .getRepository(EducationClassEnrollment)
      .save({ classroom, student });
    session = await db.getRepository(AttendanceSession).save({
      organization: a,
      contextType: "class",
      contextId: classroom.id,
      sessionDate: new Date("2026-10-12T08:00:00Z"),
    });
    access = new SchoolAccessService(
      db.getRepository(Organization),
      db.getRepository(OrganizationMembership),
    );
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    if (db?.isInitialized) await db.destroy();
    fs.rmSync(root, { recursive: true, force: true });
  });
  async function apply() {
    await db.transaction(async (manager) => migration.up(manager.queryRunner!));
  }
  function residence() {
    return new DormitoryService(
      db.getRepository(DormRoom),
      db.getRepository(DormRoomAssignment),
      db.getRepository(Student),
      access,
      {} as never,
    );
  }
  function operations() {
    return new SystemService(
      db,
      db.getRepository(AppVersion),
      db.getRepository(AppRelease),
      db.getRepository(AuditLog),
      db.getRepository(User),
    );
  }
  async function contents(source: DataSource) {
    const tables: { name: string }[] = await source.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    const result: Record<string, unknown[]> = {};
    for (const { name } of tables)
      result[name] = await source.query(
        `SELECT * FROM "${name.replace(/"/g, '""')}" ORDER BY rowid`,
      );
    return result;
  }

  it("preserves marked attendance through the pending historical night upgrade", async () => {
    const legacy = await new DataSource({
      type: "better-sqlite3",
      database: path.join(root, "legacy.sqlite"),
      prepareDatabase: (native) => native.pragma("foreign_keys = ON"),
    }).initialize();
    try {
      for (const sql of [
        "CREATE TABLE organizations(id varchar PRIMARY KEY)",
        "CREATE TABLE users(id varchar PRIMARY KEY)",
        "CREATE TABLE attendance_sessions(id varchar PRIMARY KEY,organizationId varchar NOT NULL,contextType varchar(16),contextId varchar,sessionDate datetime,note text,createdById varchar,createdAt datetime,updatedAt datetime)",
        "CREATE TABLE attendance_records(id varchar PRIMARY KEY,sessionId varchar NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,status varchar)",
        "INSERT INTO organizations VALUES('school')",
        "INSERT INTO users VALUES('teacher')",
        "INSERT INTO attendance_sessions VALUES('session','school','class','class','2026-10-12','','teacher','2026-10-12','2026-10-12')",
        "INSERT INTO attendance_records VALUES('mark','session','present')",
        "CREATE INDEX retained_attendance_date ON attendance_sessions(organizationId,sessionDate)",
      ])
        await legacy.query(sql);
      const expected = await contents(legacy);
      const native = (
        legacy.driver as unknown as { databaseConnection: Database.Database }
      ).databaseConnection;
      const backup = path.join(root, "legacy-backup.sqlite");
      await native.backup(backup);
      const restored = new Database(backup, { readonly: true });
      try {
        expect(restored.pragma("integrity_check", { simple: true })).toBe("ok");
        expect(
          restored.prepare("SELECT * FROM attendance_records").all(),
        ).toEqual(expected.attendance_records);
      } finally {
        restored.close();
      }
      await legacy.transaction(async (manager) =>
        new NightAttendance1728234800000().up(manager.queryRunner!),
      );
      expect(await contents(legacy)).toEqual(expected);
      expect(
        await legacy.query(
          "SELECT name FROM sqlite_master WHERE name='retained_attendance_date'",
        ),
      ).toHaveLength(1);
      await legacy.query(
        "INSERT INTO attendance_sessions SELECT 'night-session',organizationId,'night',contextId,sessionDate,note,createdById,createdAt,updatedAt FROM attendance_sessions WHERE id='session'",
      );
      await legacy.query(
        "INSERT INTO attendance_records VALUES('night-mark','night-session','late')",
      );
      const withNight = await contents(legacy);
      await expect(
        new NightAttendance1728234800000().down(legacy.createQueryRunner()),
      ).rejects.toThrow("Preserve all sessions and marks");
      expect(await contents(legacy)).toEqual(withNight);
    } finally {
      await legacy.destroy();
    }
  });

  it("runs the complete migration chain from zero with uniqueness and foreign keys enabled", async () => {
    const fresh = await database(path.join(root, "fresh.sqlite")).initialize();
    try {
      const indexes = await fresh.query(
        "PRAGMA index_list('attendance_records')",
      );
      expect(indexes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "UQ_attendance_record_session_student",
            unique: 1,
          }),
        ]),
      );
      expect(await fresh.query("PRAGMA foreign_key_check")).toEqual([]);
      expect(
        await fresh.query("SELECT name FROM migrations WHERE name=?", [
          migration.name,
        ]),
      ).toHaveLength(1);
    } finally {
      await fresh.destroy();
    }
  });

  it("restores an online backup with every row and custom schema object intact before upgrade", async () => {
    await db.query("CREATE TABLE retained_marker(value varchar)");
    await db.query("CREATE INDEX retained_student_name ON students(name)");
    await db.query(
      "CREATE TRIGGER retained_student_update AFTER UPDATE ON students BEGIN INSERT INTO retained_marker VALUES(NEW.id); END",
    );
    const original = await contents(db);
    const schema = await db.query(
      "SELECT type,name,sql FROM sqlite_master ORDER BY type,name",
    );
    const native = (
      db.driver as unknown as { databaseConnection: Database.Database }
    ).databaseConnection;
    await native.backup(path.join(root, "backup.sqlite"));
    await db
      .getRepository(Student)
      .update(student.id, { name: "Changed after backup" });
    await db.destroy();
    fs.copyFileSync(
      path.join(root, "backup.sqlite"),
      path.join(root, "restored.sqlite"),
    );
    db = await database(
      path.join(root, "restored.sqlite"),
      true,
      false,
    ).initialize();
    expect(await db.query("PRAGMA integrity_check")).toEqual([
      { integrity_check: "ok" },
    ]);
    expect(await db.query("PRAGMA foreign_key_check")).toEqual([]);
    expect(await contents(db)).toEqual(original);
    expect(
      await db.query(
        "SELECT type,name,sql FROM sqlite_master ORDER BY type,name",
      ),
    ).toEqual(schema);
    await apply();
    expect(await contents(db)).toEqual(original);
    expect(
      await db.query(
        "SELECT name FROM sqlite_master WHERE name LIKE 'retained_%' ORDER BY name",
      ),
    ).toHaveLength(3);
    await db.transaction(async (manager) =>
      migration.down(manager.queryRunner!),
    );
    expect(await contents(db)).toEqual(original);
    expect(await db.query("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("refuses duplicate attendance facts without changing any row or creating partial indexes", async () => {
    await db.getRepository(AttendanceRecord).insert([
      {
        session: { id: session.id },
        student: { id: student.id },
        note: "First retained observation",
      },
      {
        session: { id: session.id },
        student: { id: student.id },
        note: "Second retained observation",
      },
    ]);
    const original = await contents(db);
    await expect(apply()).rejects.toThrow("conflicting attendance pairs");
    expect(await contents(db)).toEqual(original);
    expect(
      await db.query(
        "SELECT name FROM sqlite_master WHERE name='UQ_attendance_record_session_student'",
      ),
    ).toEqual([]);
  });

  it("restores the application backup on an isolated file and records completion", async () => {
    const previous = process.env.ALLOW_REMOTE_DATABASE_RESTORE;
    process.env.ALLOW_REMOTE_DATABASE_RESTORE = "true";
    let rollback: string | undefined;
    try {
      const service = operations();
      const snapshot = await service.backup(actor.id);
      await db
        .getRepository(Student)
        .update(student.id, { name: "Changed after snapshot" });
      const result = await service.restore(actor.id, snapshot.buffer);
      rollback = result.rollbackFilename;
      expect(
        (await db.getRepository(Student).findOneByOrFail({ id: student.id }))
          .name,
      ).toBe("Local");
      expect(await db.query("PRAGMA foreign_key_check")).toEqual([]);
      expect(
        await db
          .getRepository(AuditLog)
          .count({ where: { action: "database.restore.completed" } }),
      ).toBe(1);
    } finally {
      if (previous === undefined)
        delete process.env.ALLOW_REMOTE_DATABASE_RESTORE;
      else process.env.ALLOW_REMOTE_DATABASE_RESTORE = previous;
      if (rollback)
        fs.unlinkSync(path.join(os.tmpdir(), "moshaver-v2-backups", rollback));
    }
  });

  it("rejects a structurally healthy but dangling-reference snapshot before replacement", async () => {
    await db.getRepository(AttendanceRecord).save({ session, student });
    const native = (
      db.driver as unknown as { databaseConnection: Database.Database }
    ).databaseConnection;
    const file = path.join(root, "invalid-snapshot.sqlite");
    await native.backup(file);
    const bad = new Database(file);
    try {
      bad.pragma("foreign_keys = OFF");
      bad
        .prepare(
          "UPDATE attendance_records SET studentId='missing-test-student'",
        )
        .run();
    } finally {
      bad.close();
    }
    const before = await contents(db);
    const previous = process.env.ALLOW_REMOTE_DATABASE_RESTORE;
    process.env.ALLOW_REMOTE_DATABASE_RESTORE = "true";
    try {
      await operations()
        .restore(actor.id, fs.readFileSync(file))
        .then(
          () => {
            throw new Error("Expected invalid snapshot rejection");
          },
          (error) => {
            expect(error.getStatus()).toBe(400);
            expect(error.getResponse()).toMatchObject({
              error: { code: "SQLITE_FOREIGN_KEY_INVALID" },
            });
          },
        );
    } finally {
      if (previous === undefined)
        delete process.env.ALLOW_REMOTE_DATABASE_RESTORE;
      else process.env.ALLOW_REMOTE_DATABASE_RESTORE = previous;
    }
    expect(db.isInitialized).toBe(true);
    expect(await contents(db)).toEqual(before);
  });

  it("refuses ambiguous current dorm placements and cross-school rows without automatic repair", async () => {
    await db.getRepository(DormRoomAssignment).insert([
      { room: { id: room.id }, student: { id: student.id } },
      { room: { id: otherRoom.id }, student: { id: student.id } },
    ]);
    const original = await contents(db);
    await expect(apply()).rejects.toThrow(
      "conflicting current dorm placements",
    );
    expect(await contents(db)).toEqual(original);
  });

  it("preflights mismatched legacy dorm ownership while preserving its record", async () => {
    await db
      .getRepository(DormRoomAssignment)
      .insert({ room: { id: room.id }, student: { id: foreignStudent.id } });
    const original = await contents(db);
    await expect(apply()).rejects.toThrow("conflicting dorm school ownership");
    expect(await contents(db)).toEqual(original);
  });

  it("refuses shared task pointers without repairing records", async () => {
    const plan = await db
      .getRepository(Plan)
      .save({ student, date: "2026-10-12" });
    const task = await db
      .getRepository(Task)
      .save({ plan, title: "Owned task", type: TaskType.STUDY });
    await db.getRepository(StudentPresence).insert([
      {
        student: { id: student.id },
        currentTask: { id: task.id },
        lastSeenAt: new Date(),
      },
      {
        student: { id: foreignStudent.id },
        currentTask: { id: task.id },
        lastSeenAt: new Date(),
      },
    ]);
    const original = await contents(db);
    await expect(apply()).rejects.toThrow("conflicting presence task pointers");
    expect(await contents(db)).toEqual(original);
  });

  it("enforces the nullable presence OneToOne guarantee on a valid populated upgrade", async () => {
    await db.getRepository(StudentPresence).insert([
      { student: { id: student.id }, lastSeenAt: new Date() },
      { student: { id: foreignStudent.id }, lastSeenAt: new Date() },
    ]);
    await apply();
    expect(await db.getRepository(StudentPresence).count()).toBe(2);
    const plan = await db
      .getRepository(Plan)
      .save({ student, date: "2026-10-12" });
    const task = await db
      .getRepository(Task)
      .save({ plan, title: "Owned task", type: TaskType.STUDY });
    await db
      .getRepository(StudentPresence)
      .update(
        { student: { id: student.id } },
        { currentTask: { id: task.id } },
      );
    await expect(
      db
        .getRepository(StudentPresence)
        .update(
          { student: { id: foreignStudent.id } },
          { currentTask: { id: task.id } },
        ),
    ).rejects.toThrow("UNIQUE constraint failed");
  });

  it("allows only one attendance mark for a pair across independent concurrent connections", async () => {
    await apply();
    const second = await database(
      path.join(root, "database.sqlite"),
      true,
      false,
    ).initialize();
    try {
      const writes = await Promise.allSettled([
        db
          .getRepository(AttendanceRecord)
          .insert({ session: { id: session.id }, student: { id: student.id } }),
        second
          .getRepository(AttendanceRecord)
          .insert({ session: { id: session.id }, student: { id: student.id } }),
      ]);
      expect(
        writes.filter((write) => write.status === "fulfilled"),
      ).toHaveLength(1);
      expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
      const failed = writes.find(
        (write) => write.status === "rejected",
      ) as PromiseRejectedResult;
      expect(String(failed.reason)).toContain("UNIQUE constraint failed");
    } finally {
      await second.destroy();
    }
  });

  it("deduplicates simultaneous service retry requests on the migrated schema", async () => {
    await apply();
    await db.transaction(async (manager) =>
      new AcademicSchedulingFoundation1730900000000().up(manager.queryRunner!),
    );
    const service = new AttendanceService(
      db.getRepository(AttendanceSession),
      db.getRepository(AttendanceRecord),
      db.getRepository(Student),
      db.getRepository(EducationClass),
      db.getRepository(EducationClassEnrollment),
      db.getRepository(StudyGroup),
      db.getRepository(StudyGroupMembership),
      db.getRepository(DormRoom),
      db.getRepository(DormRoomAssignment),
      db.getRepository(OrganizationMembership),
      access,
      {} as never,
      new RealtimeService(),
    );
    const command = {
      organizationId: a.id,
      sessionId: session.id,
      requestId: randomUUID(),
      entries: [{ studentId: student.id, status: "present" as const }],
    };
    const results = await Promise.all(
      Array.from({ length: 8 }, () => service.bulkMark(actor, command)),
    );
    expect(
      results.every(
        (result) => JSON.stringify(result) === JSON.stringify(results[0]),
      ),
    ).toBe(true);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    expect(await db.getRepository(AttendanceWriteReceipt).count()).toBe(1);
  });

  it("rolls back a failed placement insertion, including the old room movement", async () => {
    await apply();
    const placement = await db
      .getRepository(DormRoomAssignment)
      .save({ room, student });
    await db.query(
      `CREATE TRIGGER reject_test_placement BEFORE INSERT ON dorm_room_assignments WHEN NEW.roomId='${otherRoom.id}' BEGIN SELECT RAISE(ABORT,'injected placement failure'); END`,
    );
    await expect(
      residence().setAssignments(actor, otherRoom.id, [student.id]),
    ).rejects.toThrow("injected placement failure");
    const saved = await db
      .getRepository(DormRoomAssignment)
      .find({ relations: { room: true } });
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(placement.id);
    expect(saved[0].room.id).toBe(room.id);
  });

  it("serializes simultaneous room moves and rejects bypassed ownership/duplicate writes", async () => {
    await apply();
    await Promise.all([
      residence().setAssignments(actor, room.id, [student.id]),
      residence().setAssignments(actor, otherRoom.id, [student.id]),
    ]);
    expect(await db.getRepository(DormRoomAssignment).count()).toBe(1);
    await expect(
      db
        .getRepository(DormRoomAssignment)
        .insert({ room: { id: room.id }, student: { id: student.id } }),
    ).rejects.toThrow("UNIQUE constraint failed");
    await expect(
      db
        .getRepository(DormRoomAssignment)
        .insert({ room: { id: room.id }, student: { id: foreignStudent.id } }),
    ).rejects.toThrow("DORM_STUDENT_ORGANIZATION_MISMATCH");
    expect(await db.query("PRAGMA foreign_key_check")).toEqual([]);
  });

  it("lists only unassigned students when choosing residents for another room", async () => {
    await apply();
    const available = await db
      .getRepository(Student)
      .save({ name: "Available", organization: a });
    await residence().setAssignments(actor, room.id, [student.id]);

    await expect(
      residence().listAvailableStudents(actor, otherRoom.id),
    ).resolves.toEqual([{ id: available.id, name: "Available" }]);
  });

  it("checks capacity and school before changing placements, and returns counts in one projection query", async () => {
    await apply();
    await residence().setAssignments(actor, room.id, [student.id]);
    await expect(
      residence().setAssignments(actor, otherRoom.id, [foreignStudent.id]),
    ).rejects.toThrow();
    const second = await db
      .getRepository(Student)
      .save({ name: "Second", organization: a });
    const third = await db
      .getRepository(Student)
      .save({ name: "Third", organization: a });
    await expect(
      residence().setAssignments(actor, room.id, [
        student.id,
        second.id,
        third.id,
      ]),
    ).rejects.toThrow();
    const projectionAccess = {
      scopedOrganizationIds: async () => [a.id],
    } as unknown as SchoolAccessService;
    const service = new DormitoryService(
      db.getRepository(DormRoom),
      db.getRepository(DormRoomAssignment),
      db.getRepository(Student),
      projectionAccess,
      {} as never,
    );
    const log = jest.spyOn(db.logger, "logQuery");
    const rooms = await service.listRooms(actor);
    expect(rooms.map((row) => [row.id, row.studentCount])).toEqual([
      [room.id, 1],
      [otherRoom.id, 0],
    ]);
    expect(log).toHaveBeenCalledTimes(1);
    expect(String(log.mock.calls[0][0])).not.toContain('JOIN "students"');
  });

  it("edits room details safely and archives only empty rooms", async () => {
    await apply();
    const service = residence();
    await service.setAssignments(actor, room.id, [student.id]);

    await expect(service.updateRoom(actor, room.id, { capacity: 0 })).rejects.toMatchObject({
      response: { error: { code: "DORM_ROOM_CAPACITY" } },
    });
    await expect(service.archiveRoom(actor, room.id)).rejects.toMatchObject({
      response: { error: { code: "DORM_ROOM_OCCUPIED" } },
    });

    const updated = await service.updateRoom(actor, room.id, {
      name: "Updated room",
      building: "North wing",
      floor: 3,
      capacity: 2,
    });
    expect(updated).toEqual(
      expect.objectContaining({
        id: room.id,
        name: "Updated room",
        building: "North wing",
        floor: 3,
        capacity: 2,
        studentCount: 1,
      }),
    );

    await service.setAssignments(actor, room.id, []);
    await expect(service.archiveRoom(actor, room.id)).resolves.toEqual({
      roomId: room.id,
      status: "ARCHIVED",
    });
    expect((await service.listRooms(actor)).map((entry) => entry.id)).not.toContain(room.id);
    expect((await service.listRooms(actor, undefined, true)).find((entry) => entry.id === room.id)).toEqual(
      expect.objectContaining({ status: "ARCHIVED" }),
    );
    await expect(service.restoreRoom(actor, room.id)).resolves.toEqual({
      roomId: room.id,
      status: "ACTIVE",
    });
  });

  it("does not promote a second membership into authority or reactivate empty/inactive scope", async () => {
    await expect(access.organizationForUser(actor, b.id)).rejects.toThrow();
    expect(
      await access.organizationIds({ ...actor, organizationIds: [] }),
    ).toEqual([]);
    await db
      .getRepository(Organization)
      .update(a.id, { status: OrganizationStatus.INACTIVE });
    await expect(access.organizationForUser(actor, a.id)).rejects.toThrow();
    const platform = {
      ...actor,
      role: "PLATFORM_ADMIN",
      roles: ["PLATFORM_ADMIN"],
    };
    expect((await access.organizationForUser(platform, b.id)).id).toBe(b.id);
  });

  it("scopes workflow reads and explicit targets to the same selected school as other domains", async () => {
    const workflow = new WorkflowsService(
      db.getRepository(AttendanceSession),
      db.getRepository(AttendanceRecord),
      db.getRepository(LeaveRequest),
      db.getRepository(ExitPermission),
      db.getRepository(RequestLetter),
      db.getRepository(Student),
      db.getRepository(EducationClass),
      db.getRepository(EducationClassEnrollment),
      db.getRepository(StudyGroup),
      db.getRepository(StudyGroupMembership),
      db.getRepository(DormRoom),
      db.getRepository(DormRoomAssignment),
      db.getRepository(OrganizationMembership),
      db.getRepository(User),
      new RealtimeService(),
      {} as never,
      access,
    );
    await db.getRepository(RequestLetter).save([
      { organization: a, subject: "Local", body: "Local" },
      { organization: b, subject: "Foreign", body: "Foreign" },
    ]);
    expect(
      (await workflow.listLetters(actor)).map((letter) => letter.subject),
    ).toEqual(["Local"]);
    await expect(workflow.listLetters(actor, b.id)).rejects.toThrow();
    await expect(
      workflow.createDormRoom(actor, {
        organizationId: b.id,
        code: "invalid",
        name: "Denied",
      }),
    ).rejects.toThrow();
  });

  it("never returns persisted teacher credentials in nested schedule reads or writes", async () => {
    await apply();
    await db.transaction(async (manager) =>
      new AcademicSchedulingFoundation1730900000000().up(manager.queryRunner!),
    );
    const authorization = new AuthorizationService(
      db.getRepository(UserRoleAssignment),
      db.getRepository(OrganizationMembership),
      db.getRepository(UserRelationship),
      db.getRepository(Student),
    );
    const schedule = new ScheduleService(
      db.getRepository(SchoolScheduleEntry),
      db.getRepository(SchoolScheduleTimeBlock),
      db.getRepository(SchoolScheduleTemplate),
      db.getRepository(Organization),
      db.getRepository(OrganizationMembership),
      db.getRepository(EducationClass),
      db.getRepository(EducationClassBook),
      authorization,
    );
    const teacher = await db
      .getRepository(User)
      .findOneByOrFail({ id: actor.id });
    const book = await db.getRepository(EducationBook).save({
      id: randomUUID(),
      country: "IR",
      schoolYear: "1405-1406",
      grade: 1,
      level: "school",
      branch: "general",
      track: "general",
      category: "general",
      titleFa: "Test",
      titleEn: "Test",
      appliesTo: ["school"],
      organizationId: a.id,
    });
    const classBook = await db
      .getRepository(EducationClassBook)
      .save({ classroom, teacher, book });
    const scoped = {
      ...actor,
      capabilities: [
        "schedule.create",
        "schedule.import",
        "schedule.read",
        "schedule.export",
        "schedule.update",
      ],
    };
    const dto = {
      organizationId: a.id,
      classroomId: classroom.id,
      classBookId: classBook.id,
      teacherId: teacher.id,
      title: "Lesson",
      weekday: 1,
      startTime: "08:00",
      endTime: "09:00",
    };
    const countBefore = await db.getRepository(SchoolScheduleEntry).count();
    await expect(
      schedule.commitImport(scoped, [
        dto,
        { ...dto, classroomId: randomUUID() },
      ]),
    ).rejects.toThrow();
    expect(await db.getRepository(SchoolScheduleEntry).count()).toBe(
      countBefore,
    );
    const created = await schedule.create(scoped, dto);
    const updated = await schedule.update(scoped, created.id, {
      ...dto,
      title: "Updated",
    });
    const responses = [
      created,
      updated,
      await schedule.list(scoped),
      await schedule.export(scoped),
    ];
    expect(JSON.stringify(responses)).not.toContain("passwordHash");
    expect(JSON.stringify(responses)).not.toContain("unused-test-fixture");
    expect(created.teacher?.id).toBe(actor.id);
    expect(created.classBook?.teacher?.id).toBe(actor.id);
  });
});
