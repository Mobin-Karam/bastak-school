import { ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import type { FastifyRequest } from "fastify";
import { CapabilitiesGuard } from "../src/common/guards/capabilities.guard";
import { AttendanceOperationsController } from "../src/modules/attendance/attendance-operations.controller";
import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { DataSource } from "typeorm";
import * as entities from "../src/database/entities";
import {
  Organization,
  OrganizationType,
} from "../src/database/entities/organization.entity";
import { OrganizationMembership } from "../src/database/entities/organization-membership.entity";
import { User, UserRole } from "../src/database/entities/user.entity";
import { Student } from "../src/database/entities/student.entity";
import { EducationClass } from "../src/database/entities/education-class.entity";
import { EducationClassEnrollment } from "../src/database/entities/education-class-enrollment.entity";
import { StudyGroup } from "../src/database/entities/study-group.entity";
import { StudyGroupMembership } from "../src/database/entities/study-group-membership.entity";
import { DormRoom } from "../src/database/entities/dorm-room.entity";
import { DormRoomAssignment } from "../src/database/entities/dorm-room-assignment.entity";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
import { AttendanceRecord } from "../src/database/entities/attendance-record.entity";
import { AttendanceStatus } from "../src/database/entities/attendance-record.entity";
import { AttendancePool } from "../src/database/entities/attendance-pool.entity";
import {
  ExitPermission,
  ExitPermissionStatus,
} from "../src/database/entities/exit-permission.entity";
import { AttendancePolicy } from "../src/database/entities/attendance-policy.entity";
import { DormAttendanceDelegate } from "../src/database/entities/dorm-attendance-delegate.entity";
import {
  SchoolAcademicTerm,
  SchoolAcademicYear,
} from "../src/database/entities/school-academic-year.entity";
import { AuditLog } from "../src/database/entities/audit-log.entity";
import {
  AttendanceOperationsService,
  attendanceSummaryWindow,
} from "../src/modules/attendance/attendance-operations.service";
import { AttendanceService } from "../src/modules/attendance/attendance.service";
import { SchoolAccessService } from "../src/modules/school-access";
import { AuthorizationService } from "../src/modules/authorization";
import { RealtimeService } from "../src/modules/realtime";
import { RewardsService } from "../src/modules/rewards";
import { StudentRewardLedger } from "../src/database/entities/student-reward-ledger.entity";
import type { AuthenticatedUser } from "../src/modules/auth";
import type { CreateAttendancePoolDto } from "../src/modules/attendance/attendance.dto";
import { shiftSchoolDate } from "../src/modules/attendance/attendance-time";

describe("attendance delegation, live pools and staff privacy (SQLite)", () => {
  let db: DataSource;
  let service: AttendanceService;
  let operations: AttendanceOperationsService;
  let staff: AuthenticatedUser;
  let studentActor: AuthenticatedUser;
  let otherActor: AuthenticatedUser;
  let org: Organization;
  let foreign: Organization;
  let room: DormRoom;
  let otherRoom: DormRoom;
  let students: Student[];
  let day: string;
  const realtime = new RealtimeService();
  beforeEach(async () => {
    db = await new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
      entities: Object.values(entities).filter(
        (value) => typeof value === "function",
      ),
      synchronize: true,
    }).initialize();
    [org, foreign] = await db.getRepository(Organization).save([
      { name: "School", type: OrganizationType.SCHOOL },
      { name: "Other school", type: OrganizationType.SCHOOL },
    ]);
    const users = await db.getRepository(User).save([
      { username: "staff", passwordHash: "test-only", role: UserRole.TEACHER },
      {
        username: "representative",
        passwordHash: "test-only",
        role: UserRole.STUDENT,
      },
      {
        username: "resident",
        passwordHash: "test-only",
        role: UserRole.STUDENT,
      },
      {
        username: "other-resident",
        passwordHash: "test-only",
        role: UserRole.STUDENT,
      },
    ]);
    for (const user of users)
      await db
        .getRepository(OrganizationMembership)
        .save({ user, organization: org });
    staff = {
      id: users[0].id,
      username: "staff",
      role: "PRINCIPAL",
      roles: ["PRINCIPAL"],
      capabilities: [
        "attendance.manage",
        "attendance.read",
        "attendance.review",
        "attendance.delegate",
      ],
      sessionId: "staff",
      organizationIds: [org.id],
      activeOrganizationId: org.id,
    };
    studentActor = {
      ...staff,
      id: users[1].id,
      username: "representative",
      role: "STUDENT",
      roles: ["STUDENT"],
      capabilities: ["attendance.self.read"],
    };
    otherActor = {
      ...studentActor,
      id: users[3].id,
      username: "other-resident",
    };
    students = await db.getRepository(Student).save(
      users.slice(1).map((user, index) => ({
        user,
        organization: org,
        name: `Student ${index + 1}`,
      })),
    );
    [room, otherRoom] = await db.getRepository(DormRoom).save([
      { organization: org, code: "A", name: "Room A", capacity: 2 },
      { organization: org, code: "B", name: "Room B" },
    ]);
    await db.getRepository(DormRoomAssignment).save([
      { room, student: students[0] },
      { room, student: students[1] },
      { room: otherRoom, student: students[2] },
    ]);
    const access = new SchoolAccessService(
      db.getRepository(Organization),
      db.getRepository(OrganizationMembership),
    );
    service = new AttendanceService(
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
      {} as AuthorizationService,
      realtime,
      new RewardsService(
        db.getRepository(StudentRewardLedger),
        db.getRepository(Student),
        db.getRepository(AuditLog),
        access,
        {} as AuthorizationService,
      ),
    );
    operations = new AttendanceOperationsService(
      db.getRepository(AttendanceSession),
      service,
      access,
      realtime,
      new RewardsService(
        db.getRepository(StudentRewardLedger),
        db.getRepository(Student),
        db.getRepository(AuditLog),
        access,
        {} as AuthorizationService,
      ),
    );
    day = attendanceSummaryWindow().day;
    const academicYear = await db.getRepository(SchoolAcademicYear).save({
      organizationId: org.id,
      name: "Active study year",
      startsOn: "2026-01-01",
      endsOn: "2027-12-31",
      state: "ACTIVE",
    });
    await db.getRepository(SchoolAcademicTerm).save({
      academicYearId: academicYear.id,
      name: "Active semester",
      startsOn: "2026-01-01",
      endsOn: "2027-12-31",
      state: "ACTIVE",
    });
  });
  afterEach(async () => {
    await db.destroy();
  });
  async function grant() {
    return operations.setDelegate(staff, room.id, {
      studentId: students[0].id,
      startsOn: day,
      endsOn: day,
    });
  }
  function poolDraft(): CreateAttendancePoolDto {
    return {
      requestId: randomUUID(),
      organizationId: org.id,
      contextType: "dorm",
      contextId: room.id,
      title: "Evening gathering",
      place: "Hall",
      durationMinutes: 15,
    };
  }
  it("grants every active school room and rejects residents outside the granted room", async () => {
    await operations.setDormWideDelegate(staff, {
      studentId: students[0].id,
      startsOn: day,
      endsOn: day,
    });
    const assignments = await operations.myDormAssignments(studentActor);
    expect(assignments).toHaveLength(4);
    const other = assignments.find((row) => row.roomId === otherRoom.id)!;
    expect(other.dormWide).toBe(true);
    const saved = await operations.markDorm(studentActor, other.id, {
      requestId: randomUUID(),
      expectedRevision: 0,
      nightDate: day,
      roomId: otherRoom.id,
      attendancePeriod: "night",
      entries: [{ studentId: students[2].id, status: "present" }],
    });
    expect(saved).toMatchObject({ count: 1 });
    const savedSession = await db
      .getRepository(AttendanceSession)
      .findOneByOrFail({ id: saved.sessionId });
    await expect(
      operations.markDorm(studentActor, other.id, {
        requestId: randomUUID(),
        expectedRevision: savedSession.revision,
        nightDate: day,
        roomId: otherRoom.id,
        attendancePeriod: "night",
        entries: [{ studentId: students[1].id, status: "present" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_DELEGATE_SCOPE" } },
    });
    await db
      .getRepository(DormRoomAssignment)
      .delete({ student: { id: students[0].id } });
    expect(await operations.myDormAssignments(studentActor)).toEqual([]);
    await expect(
      operations.markDorm(studentActor, other.id, {
        requestId: randomUUID(),
        expectedRevision: savedSession.revision,
        nightDate: day,
        roomId: otherRoom.id,
        attendancePeriod: "night",
        entries: [{ studentId: students[2].id, status: "present" }],
      }),
    ).rejects.toThrow();
  });
  it("revokes dorm-wide access while preserving a room-specific replacement", async () => {
    await operations.setDormWideDelegate(staff, {
      studentId: students[0].id,
      startsOn: day,
      endsOn: day,
    });
    await operations.setDelegate(staff, otherRoom.id, {
      studentId: students[2].id,
      startsOn: day,
      endsOn: day,
    });
    await operations.revokeDormWideDelegate(staff);
    expect(await operations.myDormAssignments(studentActor)).toEqual([]);
    expect(await operations.myDormAssignments(otherActor)).toHaveLength(2);
  });
  it("requires staff authority for dorm-wide delegation and preserves room-only grants", async () => {
    await expect(
      operations.setDormWideDelegate(studentActor, {
        studentId: students[0].id,
        startsOn: day,
        endsOn: day,
      }),
    ).rejects.toThrow();
    await operations.setDormWideDelegate(staff, {
      studentId: students[0].id,
      startsOn: day,
      endsOn: day,
    });
    await operations.setDelegate(staff, otherRoom.id, {
      studentId: students[2].id,
      startsOn: day,
      endsOn: day,
    });
    const assignments = await operations.myDormAssignments(studentActor);
    expect(assignments).toHaveLength(4);
    expect(assignments[0].roomId).toBe(room.id);
    expect((await operations.myDormAssignments(otherActor))[0].dormWide).toBe(
      false,
    );
  });
  it("allows one current room representative, replacing rather than stacking authority", async () => {
    await grant();
    await operations.setDelegate(staff, room.id, {
      studentId: students[1].id,
      startsOn: day,
      endsOn: shiftSchoolDate(day, 2),
    });
    expect(await db.getRepository(DormAttendanceDelegate).count()).toBe(1);
    expect(await operations.myDormAssignments(studentActor)).toEqual([]);
    expect(await db.getRepository(AuditLog).count()).toBe(2);
  });
  it("rejects foreign rooms, nonresidents and invalid date ranges before writing", async () => {
    await expect(
      operations.setDelegate(staff, room.id, {
        studentId: students[2].id,
        startsOn: day,
        endsOn: day,
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_DELEGATE_NOT_RESIDENT" } },
    });
    await expect(
      operations.setDelegate(staff, room.id, {
        studentId: students[0].id,
        startsOn: day,
        endsOn: shiftSchoolDate(day, -1),
      }),
    ).rejects.toThrow();
    const foreignRoom = await db
      .getRepository(DormRoom)
      .save({ organization: foreign, code: "C", name: "Foreign" });
    await expect(
      operations.setDelegate(staff, foreignRoom.id, {
        studentId: students[0].id,
        startsOn: day,
        endsOn: day,
      }),
    ).rejects.toThrow();
    expect(await db.getRepository(DormAttendanceDelegate).count()).toBe(0);
  });
  it("lets an assigned student mark only current-night residents without granting staff capabilities", async () => {
    const delegate = await grant();
    const result = await operations.markDorm(studentActor, delegate.id, {
      requestId: randomUUID(),
      expectedRevision: 0,
      nightDate: day,
      entries: [{ studentId: students[1].id, status: "absent" }],
    });
    expect(result.count).toBe(2);
    const saved = await db
      .getRepository(AttendanceSession)
      .findOneByOrFail({ id: result.sessionId });
    expect(saved.rosterSnapshot).toHaveLength(2);
    expect(saved.contextType).toBe("dorm");
    await expect(operations.staffSessions(studentActor)).rejects.toThrow();
    await expect(
      operations.markDorm(studentActor, delegate.id, {
        requestId: randomUUID(),
        expectedRevision: 1,
        nightDate: day,
        entries: [{ studentId: students[2].id, status: "present" }],
      }),
    ).rejects.toThrow();
    expect(await db.getRepository(AttendanceRecord).count()).toBe(2);
  });
  it("replays timed-out dorm writes, detects conflicting versions and rechecks revocation", async () => {
    const delegate = await grant();
    const write = {
      requestId: randomUUID(),
      expectedRevision: 0,
      nightDate: day,
      entries: [{ studentId: students[0].id, status: "present" as const }],
    };
    const first = await operations.markDorm(studentActor, delegate.id, write);
    expect(await operations.markDorm(studentActor, delegate.id, write)).toEqual(
      first,
    );
    await expect(
      operations.markDorm(studentActor, delegate.id, {
        ...write,
        requestId: randomUUID(),
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_REVISION_CONFLICT" } },
    });
    await operations.revokeDelegate(staff, room.id);
    await expect(
      operations.markDorm(studentActor, delegate.id, write),
    ).rejects.toThrow();
    expect(await db.getRepository(AttendanceRecord).count()).toBe(2);
  });
  it("blocks other accounts, expired dates and past-night marking", async () => {
    const delegate = await grant();
    const write = {
      requestId: randomUUID(),
      expectedRevision: 0,
      nightDate: day,
      entries: [{ studentId: students[0].id, status: "present" as const }],
    };
    await expect(
      operations.markDorm(otherActor, delegate.id, write),
    ).rejects.toThrow();
    await expect(
      operations.markDorm(studentActor, delegate.id, {
        ...write,
        nightDate: shiftSchoolDate(day, -1),
      }),
    ).rejects.toThrow();
    await operations.setDelegate(staff, room.id, {
      studentId: students[0].id,
      startsOn: shiftSchoolDate(day, -2),
      endsOn: shiftSchoolDate(day, -1),
    });
    await expect(
      operations.markDorm(studentActor, delegate.id, write),
    ).rejects.toThrow();
    expect(await db.getRepository(AttendanceSession).count()).toBe(0);
  });
  it("rechecks residency and school membership before a delegated write", async () => {
    const delegate = await grant();
    await db
      .getRepository(DormRoomAssignment)
      .delete({ student: { id: students[0].id } });
    await expect(
      operations.markDorm(studentActor, delegate.id, {
        requestId: randomUUID(),
        expectedRevision: 0,
        nightDate: day,
        entries: [{ studentId: students[1].id, status: "present" }],
      }),
    ).rejects.toThrow();
    expect(await operations.myDormAssignments(studentActor)).toEqual([]);
  });
  it("targets gathering check-ins to snapshot members and persists one self confirmation", async () => {
    const draft = poolDraft();
    const pool = await operations.createPool(staff, draft);
    expect((await operations.createPool(staff, draft)).id).toBe(pool.id);
    expect(await db.getRepository(AttendancePool).count()).toBe(1);
    expect(await operations.myPools(studentActor)).toEqual([
      expect.objectContaining({ id: pool.id, place: "Hall" }),
    ]);
    expect(await operations.myPools(otherActor)).toEqual([]);
    await expect(operations.checkIn(otherActor, pool.id)).rejects.toThrow();
    await Promise.all([
      operations.checkIn(studentActor, pool.id),
      operations.checkIn(studentActor, pool.id),
    ]);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    expect(await operations.myPools(studentActor)).toEqual([]);
    expect(await operations.pools(staff)).toEqual([
      expect.objectContaining({ present: 1, remaining: 1 }),
    ]);
    const detail = await service.sessionDetail(staff, pool.sessionId);
    expect(detail.roster).toHaveLength(2);
    expect(detail.unmarked).toBe(1);
  });
  it("closes gatherings without fabricating absence or deleting history", async () => {
    const pool = await operations.createPool(staff, poolDraft());
    await operations.checkIn(studentActor, pool.id);
    await operations.closePool(staff, pool.id);
    await expect(operations.checkIn(studentActor, pool.id)).rejects.toThrow();
    expect(await operations.myPools(studentActor)).toEqual([]);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    expect((await service.sessionDetail(staff, pool.sessionId)).unmarked).toBe(
      1,
    );
  });
  it("rejects expired gathering responses and foreign active school contexts", async () => {
    const pool = await operations.createPool(staff, poolDraft());
    await db
      .getRepository(AttendancePool)
      .update(pool.id, { endsAt: new Date(Date.now() - 1000) });
    await expect(operations.checkIn(studentActor, pool.id)).rejects.toThrow();
    await expect(
      operations.checkIn(
        { ...studentActor, activeOrganizationId: foreign.id },
        pool.id,
      ),
    ).rejects.toThrow();
    await expect(
      operations.closePool(
        { ...staff, activeOrganizationId: foreign.id },
        pool.id,
      ),
    ).rejects.toThrow();
  });
  it("keeps detailed profiles staff-only and gives students encouragement without session details", async () => {
    const pool = await operations.createPool(staff, poolDraft());
    await operations.checkIn(studentActor, pool.id);
    await expect(
      operations.staffProfile(studentActor, students[0].id),
    ).rejects.toThrow();
    await expect(
      operations.staffProfile(
        { ...staff, role: "TEACHER", roles: ["TEACHER"] },
        students[0].id,
      ),
    ).rejects.toThrow();
    expect(
      (await operations.staffProfile(staff, students[0].id)).records,
    ).toHaveLength(1);
    expect(await operations.encouragement(studentActor)).toEqual(
      expect.objectContaining({ present: 1, attendanceRate: 100 }),
    );
    expect(await service.listSelfRecords(studentActor)).toEqual([
      expect.objectContaining({
        status: "present",
        physicalStatus: "present",
        reviewStatus: null,
      }),
    ]);
    expect((await service.summary(studentActor)).recent).toEqual([]);
  });
  it("gives a teacher only the profile facts for their assigned class", async () => {
    const teacher = await db
      .getRepository(User)
      .findOneByOrFail({ id: staff.id });
    const classroom = await db.getRepository(EducationClass).save({
      organization: org,
      code: "7-A",
      name: "هفتم الف",
      schoolYear: "1405-1406",
      gradeId: 7,
      educationTypeId: "general",
      trackId: "general",
      advisor: teacher,
    });
    await db.getRepository(EducationClassEnrollment).save({
      classroom,
      student: students[0],
    });
    const session = await db.getRepository(AttendanceSession).save({
      organization: org,
      contextType: "class",
      contextId: classroom.id,
      sessionDate: new Date(),
      titleSnapshot: "ریاضی",
      rosterSnapshot: [
        {
          id: students[0].id,
          name: students[0].name,
          nationalCode: null,
          userId: students[0].user?.id ?? null,
        },
      ],
    });
    await db.getRepository(AttendanceRecord).save({
      session,
      student: students[0],
      status: AttendanceStatus.PRESENT,
    });

    const teacherActor = {
      ...staff,
      role: "TEACHER",
      roles: ["TEACHER"],
      capabilities: ["attendance.class.read"],
    };
    const profile = await operations.staffProfile(teacherActor, students[0].id);

    expect(profile).toMatchObject({
      classNames: ["هفتم الف"],
      attendanceRate: 100,
      attendanceCoverage: 100,
      scopedToTeacherClasses: true,
      counts: { present: 1 },
    });
    expect(profile.records).toHaveLength(1);
    await expect(operations.staffSessions(teacherActor)).resolves.toMatchObject(
      {
        total: 1,
        items: [expect.objectContaining({ contextId: classroom.id })],
      },
    );
    await expect(operations.dailyOverview(teacherActor)).resolves.toMatchObject(
      {
        sessions: 1,
        present: 1,
      },
    );
  });
  it("enforces operation capabilities, DTO limits and check-in self identity over HTTP", async () => {
    const module = await Test.createTestingModule({
      controllers: [AttendanceOperationsController],
      providers: [
        { provide: AttendanceOperationsService, useValue: operations },
      ],
    }).compile();
    const app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix("api/v2");
    app.useGlobalGuards(new CapabilitiesGuard(new Reflector()));
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    let actor = studentActor;
    app
      .getHttpAdapter()
      .getInstance()
      .addHook("preHandler", async (request: FastifyRequest) => {
        (request as FastifyRequest & { user: AuthenticatedUser }).user = actor;
      });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    try {
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/api/v2/attendance/overview",
          })
        ).statusCode,
      ).toBe(403);
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/api/v2/attendance/pools",
            payload: poolDraft(),
          })
        ).statusCode,
      ).toBe(403);
      actor = staff;
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/api/v2/attendance/pools",
            payload: { ...poolDraft(), durationMinutes: 241 },
          })
        ).statusCode,
      ).toBe(400);
      const created = await app.inject({
        method: "POST",
        url: "/api/v2/attendance/pools",
        payload: poolDraft(),
      });
      expect(created.statusCode).toBe(201);
      const poolId = created.json().data.id;
      actor = studentActor;
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/api/v2/student/attendance/pools/${poolId}/check-in`,
            payload: { confirmation: "here", studentId: students[1].id },
          })
        ).statusCode,
      ).toBe(400);
      expect(await db.getRepository(AttendanceRecord).count()).toBe(0);
      expect(
        (
          await app.inject({
            method: "POST",
            url: `/api/v2/student/attendance/pools/${poolId}/check-in`,
            payload: { confirmation: "here" },
          })
        ).statusCode,
      ).toBe(201);
      expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    } finally {
      await app.close();
    }
  });

  it("starts a fresh summary at 16:00 Tehran while retaining older sessions and records", async () => {
    const window = attendanceSummaryWindow();
    await db.getRepository(AttendanceSession).save([
      {
        organization: org,
        contextType: "dorm",
        contextId: room.id,
        sessionDate: new Date(window.startsAt.getTime() - 1),
      },
      {
        organization: org,
        contextType: "dorm",
        contextId: room.id,
        sessionDate: window.startsAt,
      },
      {
        organization: foreign,
        contextType: "dorm",
        contextId: room.id,
        sessionDate: window.startsAt,
      },
    ]);
    expect((await operations.dailyOverview(staff)).sessions).toBe(0);
    expect(await operations.staffSessions(staff)).toMatchObject({
      total: 0,
      items: [],
    });
    await expect(
      operations.staffSessions(staff, { page: 1, limit: 1 }),
    ).resolves.toMatchObject({ total: 0, hasNext: false, items: [] });
    expect(await db.getRepository(AttendanceSession).count()).toBe(3);
    expect(
      attendanceSummaryWindow(new Date("2026-10-11T12:29:59.999Z")).day,
    ).toBe("2026-10-10");
    expect(attendanceSummaryWindow(new Date("2026-10-11T12:30:00Z")).day).toBe(
      "2026-10-11",
    );
  });

  it("keeps teacher reports on outside students pending principal verification", async () => {
    const classroom = await db.getRepository(EducationClass).save({
      organization: org,
      name: "Class A",
      code: "A1",
      schoolYear: "1405",
      gradeId: 1,
      educationTypeId: "general",
      trackId: "general",
    });
    const session = await db.getRepository(AttendanceSession).save({
      organization: org,
      contextType: "class",
      contextId: classroom.id,
      sessionDate: new Date(),
      status: "submitted",
      revision: 1,
      rosterSnapshot: [{ id: students[0].id, name: students[0].name }],
    });
    await db.getRepository(AttendanceRecord).save({
      session,
      student: students[0],
      status: AttendanceStatus.PRESENT,
      revision: 1,
      recordedBy: { id: staff.id } as User,
    });
    await db.getRepository(ExitPermission).save({
      organization: org,
      student: students[0],
      requestedDepartureAt: new Date(Date.now() - 60_000),
      actualDepartureAt: new Date(Date.now() - 60_000),
      destination: "Outside school",
      reason: "Unauthorized departure",
      note: "Dorm review",
      origin: "dorm_unauthorized",
      status: ExitPermissionStatus.APPROVED,
    });

    const reporter = {
      ...staff,
      capabilities: [...(staff.capabilities ?? []), "attendance.class.read"],
    };
    const reported = await operations.reportOutsideStudentPresent(
      reporter,
      session.id,
      students[0].id,
      "Seen in class",
    );
    expect(reported.reported).toBe(true);
    expect(await operations.outsidePresenceReports(staff)).toMatchObject([
      expect.objectContaining({
        studentId: students[0].id,
        note: "Seen in class",
      }),
    ]);

    await operations.verifyOutsideStudentPresence(
      staff,
      reported.exitPermissionId,
    );
    expect(await operations.outsidePresenceReports(staff)).toHaveLength(0);
    const savedExit = await db.getRepository(ExitPermission).findOneByOrFail({
      id: reported.exitPermissionId,
    });
    expect(savedExit.actualReturnAt).toBeInstanceOf(Date);
    expect(savedExit.status).toBe(ExitPermissionStatus.COMPLETED);
  });

  it("loads the school relation when building the principal dorm review queue", async () => {
    const session = await db.getRepository(AttendanceSession).save({
      organization: org,
      contextType: "dorm",
      contextId: room.id,
      sessionDate: new Date(),
      operationalDate: day,
      attendancePeriod: "night",
      dormAttendanceRole: "primary",
      dormForwardedAt: new Date(),
      status: "submitted",
      rosterSnapshot: [
        {
          id: students[0].id,
          name: students[0].name,
          nationalCode: null,
          userId: null,
        },
      ],
    });
    await db.getRepository(AttendanceRecord).save({
      session,
      student: students[0],
      status: AttendanceStatus.ABSENT,
    });

    await expect(operations.dormReviewQueue(staff)).resolves.toMatchObject([
      {
        id: session.id,
        roomId: room.id,
        total: 1,
        recorded: 1,
        absent: 1,
        attendanceRole: "primary",
      },
    ]);
  });

  it("records an unauthorized dorm departure from the principal review queue", async () => {
    const session = await db.getRepository(AttendanceSession).save({
      organization: org,
      contextType: "dorm",
      contextId: room.id,
      sessionDate: new Date(Date.now() - 60_000),
      operationalDate: day,
      attendancePeriod: "night",
      dormAttendanceRole: "primary",
      dormForwardedAt: new Date(Date.now() - 30_000),
      status: "submitted",
      rosterSnapshot: [{ id: students[0].id, name: students[0].name }],
    });
    await db.getRepository(AttendanceRecord).save({
      session,
      student: students[0],
      status: AttendanceStatus.ABSENT,
    });

    const first = await operations.markUnauthorizedDormDeparture(
      staff,
      session.id,
      students[0].id,
    );
    await expect(
      operations.markUnauthorizedDormDeparture(
        staff,
        session.id,
        students[0].id,
      ),
    ).resolves.toMatchObject({
      exitPermissionId: first.exitPermissionId,
      studentId: students[0].id,
      origin: "dorm_unauthorized",
      unauthorizedOutside: 1,
      currentlyInSchool: 2,
    });
    expect(
      await db.getRepository(ExitPermission).count({
        where: {
          student: { id: students[0].id },
          origin: "dorm_unauthorized",
        },
      }),
    ).toBe(1);
    await expect(
      db.getRepository(ExitPermission).findOneByOrFail({
        student: { id: students[0].id },
        origin: "dorm_unauthorized",
      }),
    ).resolves.toMatchObject({
      status: ExitPermissionStatus.APPROVED,
      origin: "dorm_unauthorized",
    });
  });

  it("reports finalized facts only and excludes submitted/cancelled sessions from its denominator", async () => {
    const [finalized, submitted, cancelled] = await db
      .getRepository(AttendanceSession)
      .save([
        {
          organization: org,
          contextType: "dorm",
          contextId: room.id,
          sessionDate: new Date(),
          status: "finalized",
        },
        {
          organization: org,
          contextType: "dorm",
          contextId: room.id,
          sessionDate: new Date(),
          status: "submitted",
        },
        {
          organization: org,
          contextType: "dorm",
          contextId: room.id,
          sessionDate: new Date(),
          status: "cancelled",
        },
      ]);
    await db.getRepository(AttendanceRecord).save([
      {
        session: finalized,
        student: students[0],
        status: AttendanceStatus.PRESENT,
      },
      {
        session: finalized,
        student: students[1],
        status: AttendanceStatus.ABSENT,
      },
      {
        session: submitted,
        student: students[0],
        status: AttendanceStatus.ABSENT,
      },
      {
        session: cancelled,
        student: students[1],
        status: AttendanceStatus.ABSENT,
      },
    ]);
    const report = await operations.reportSummary({
      ...staff,
      capabilities: [...(staff.capabilities ?? []), "attendance.reports.read"],
    });
    expect(report).toMatchObject({
      finalizedSessions: 1,
      denominator: 2,
      present: 1,
      absent: 1,
      attendanceRate: 50,
    });
  });

  it("respects the organization policy when deciding whether late counts as present", async () => {
    const finalized = await db.getRepository(AttendanceSession).save({
      organization: org,
      contextType: "dorm",
      contextId: room.id,
      sessionDate: new Date(),
      status: "finalized",
    });
    await db.getRepository(AttendanceRecord).save({
      session: finalized,
      student: students[0],
      status: AttendanceStatus.LATE,
    });
    await db.getRepository(AttendancePolicy).save({
      organization: org,
      lateCountsAsPresent: false,
      dayStartsAt: "04:00",
      timeZone: "Asia/Tehran",
    });
    const report = await operations.reportSummary({
      ...staff,
      capabilities: [...(staff.capabilities ?? []), "attendance.reports.read"],
    });
    expect(report).toMatchObject({
      denominator: 1,
      late: 1,
      attendanceRate: 0,
    });
  });

  it("rejects an inverted management report range before querying attendance facts", async () => {
    await expect(
      operations.reportSummary(
        {
          ...staff,
          capabilities: [
            ...(staff.capabilities ?? []),
            "attendance.reports.read",
          ],
        },
        "2026-10-31T00:00:00.000Z",
        "2026-10-01T23:59:59.999Z",
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_REPORT_DATE_RANGE" } },
    });
  });

  it("filters finalized report facts by immutable academic-year and term snapshots", async () => {
    const [matching, other] = await db.getRepository(AttendanceSession).save([
      {
        organization: org,
        contextType: "dorm",
        contextId: room.id,
        sessionDate: new Date(),
        status: "finalized",
        academicYearIdSnapshot: "year-a",
        termIdSnapshot: "term-a",
      },
      {
        organization: org,
        contextType: "dorm",
        contextId: room.id,
        sessionDate: new Date(),
        status: "finalized",
        academicYearIdSnapshot: "year-b",
        termIdSnapshot: "term-b",
      },
    ]);
    await db.getRepository(AttendanceRecord).save([
      {
        session: matching,
        student: students[0],
        status: AttendanceStatus.PRESENT,
      },
      { session: other, student: students[1], status: AttendanceStatus.ABSENT },
    ]);
    await expect(
      operations.reportSummary(
        {
          ...staff,
          capabilities: [
            ...(staff.capabilities ?? []),
            "attendance.reports.read",
          ],
        },
        undefined,
        undefined,
        { academicYearId: "year-a", termId: "term-a" },
      ),
    ).resolves.toMatchObject({
      finalizedSessions: 1,
      present: 1,
      absent: 0,
      academicYearId: "year-a",
      termId: "term-a",
    });
  });
});
