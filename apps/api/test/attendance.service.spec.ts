import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import type { FastifyRequest } from "fastify";
import { CapabilitiesGuard } from "../src/common/guards/capabilities.guard";
import { AuditLog } from "../src/database/entities/audit-log.entity";
import { Role } from "../src/database/entities/role.entity";
import { Permission } from "../src/database/entities/permission.entity";
import { RolePermission } from "../src/database/entities/role-permission.entity";
import { UserRoleAssignment } from "../src/database/entities/user-role-assignment.entity";
import { AttendanceWriteReceipt } from "../src/database/entities/attendance-write-receipt.entity";
import { AttendanceWriteReceipts1730100000000 } from "../src/database/migrations/1730100000000-AttendanceWriteReceipts";
import { AttendanceController } from "../src/modules/attendance/attendance.controller";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { BulkMarkAttendanceDto } from "../src/modules/attendance/attendance.dto";
import { DataSource } from "typeorm";
import * as entities from "../src/database/entities";
import { AttendanceService } from "../src/modules/attendance/attendance.service";
import { SchoolAccessService } from "../src/modules/school-access/school-access.service";
import { AuthorizationService } from "../src/modules/authorization";
import { RealtimeService } from "../src/modules/realtime/realtime.service";
import type { AuthenticatedUser } from "../src/modules/auth";
import { AttendanceRecord } from "../src/database/entities/attendance-record.entity";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
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

describe("AttendanceService organization boundaries (real SQLite)", () => {
  let db: DataSource;
  let service: AttendanceService;
  let actor: AuthenticatedUser;
  let orgA: Organization;
  let orgB: Organization;
  let assignedClass: EducationClass;
  let foreignClass: EducationClass;
  let foreignGroup: StudyGroup;
  let foreignRoom: DormRoom;
  let studentA: Student;
  let studentB: Student;
  const realtime = new RealtimeService();
  const emit = jest.spyOn(realtime, "emitToUsers");

  beforeEach(async () => {
    emit.mockClear();
    db = await new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
      entities: Object.values(entities).filter(
        (value) => typeof value === "function",
      ),
      synchronize: true,
    }).initialize();
    const organizations = db.getRepository(Organization);
    [orgA, orgB] = await organizations.save([
      { name: "School A", type: OrganizationType.SCHOOL },
      { name: "School B", type: OrganizationType.SCHOOL },
    ]);
    const user = await db.getRepository(User).save({
      username: "attendance-test-staff",
      passwordHash: "not-a-login-hash",
      role: UserRole.TEACHER,
    });
    await db
      .getRepository(OrganizationMembership)
      .save({ organization: orgA, user });
    actor = {
      id: user.id,
      username: user.username,
      role: "PRINCIPAL",
      roles: ["PRINCIPAL"],
      capabilities: ["attendance.read", "attendance.manage"],
      sessionId: "test-session",
      organizationIds: [orgA.id],
      activeOrganizationId: orgA.id,
    };
    [studentA, studentB] = await db.getRepository(Student).save([
      { name: "Student A", organization: orgA },
      { name: "Student B", organization: orgB },
    ]);
    [assignedClass, foreignClass] = await db
      .getRepository(EducationClass)
      .save([
        {
          organization: orgA,
          code: "A",
          name: "Class A",
          schoolYear: "1405",
          gradeId: 1,
          educationTypeId: "school",
          trackId: "general",
          advisor: user,
        },
        {
          organization: orgB,
          code: "B",
          name: "Class B",
          schoolYear: "1405",
          gradeId: 1,
          educationTypeId: "school",
          trackId: "general",
        },
      ]);
    await db.getRepository(EducationClassEnrollment).save([
      { classroom: assignedClass, student: studentA },
      { classroom: foreignClass, student: studentB },
    ]);
    foreignGroup = await db.getRepository(StudyGroup).save({
      organization: orgB,
      classroom: foreignClass,
      code: "G",
      name: "Group B",
    });
    await db
      .getRepository(StudyGroupMembership)
      .save({ group: foreignGroup, student: studentB });
    foreignRoom = await db
      .getRepository(DormRoom)
      .save({ organization: orgB, code: "R", name: "Room B" });
    await db
      .getRepository(DormRoomAssignment)
      .save({ room: foreignRoom, student: studentB });
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
      new SchoolAccessService(
        organizations,
        db.getRepository(OrganizationMembership),
      ),
      {} as AuthorizationService,
      realtime,
    );
  });
  afterEach(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it("returns parent class IDs for scoped attendance groups", async () => {
    const group = await db.getRepository(StudyGroup).save({
      organization: orgA,
      classroom: assignedClass,
      code: "GA",
      name: "Group A",
    });
    const contexts = await service.listContexts(actor);
    expect(contexts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: group.id,
          contextType: "class_group",
          classId: assignedClass.id,
        }),
      ]),
    );
    expect(contexts.some((context) => context.id === foreignGroup.id)).toBe(
      false,
    );
  });

  it("rejects direct excused marks without creating attendance or bypassing review", async () => {
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        entries: [{ studentId: studentA.id, status: "excused" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_EXCUSE_REQUIRES_REVIEW" } },
    });
    expect(await db.getRepository(AttendanceRecord).count()).toBe(0);
    expect(await db.getRepository(AttendanceSession).count()).toBe(0);
    expect(emit).not.toHaveBeenCalled();
  });

  it("returns saved records with unknown legacy roster totals rather than today's membership", async () => {
    const marked = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent", note: "Illness" }],
    });
    // Model a pre-snapshot session; new manual sessions now capture their full roster.
    await db
      .getRepository(AttendanceSession)
      .update(marked.sessionId, {
        rosterSnapshot: null,
        rosterCapturedAt: null,
      });
    await db
      .getRepository(EducationClassEnrollment)
      .delete({ classroom: { id: assignedClass.id } });
    const detail = await service.sessionDetail(actor, marked.sessionId);
    expect(detail).toMatchObject({
      id: marked.sessionId,
      roster: [],
      rosterComplete: false,
      expected: null,
      unmarked: null,
      marked: 1,
      records: [
        expect.objectContaining({
          studentId: studentA.id,
          physicalStatus: "absent",
          revision: 1,
          note: "Illness",
        }),
      ],
    });
    await service.reviewAbsence(actor, marked.records[0].id, {
      decision: "approved",
      note: "Reviewed evidence",
    });
    expect(
      (await service.sessionDetail(actor, marked.sessionId)).records[0],
    ).toMatchObject({
      physicalStatus: "absent",
      legacyStatus: "excused",
      reviewStatus: "approved",
      revision: 2,
    });
    expect(await service.sessionHistory(actor, marked.sessionId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "attendance.records.marked",
          organizationId: orgA.id,
        }),
        expect.objectContaining({
          action: "attendance.absence.reviewed",
          organizationId: orgA.id,
        }),
      ]),
    );
  });

  it("captures the full roster when a new manual session is marked", async () => {
    const member = await db
      .getRepository(Student)
      .save({ organization: orgA, name: "Unmarked member" });
    await db
      .getRepository(EducationClassEnrollment)
      .save({ classroom: assignedClass, student: member });
    const marked = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "present" }],
    });
    await db
      .getRepository(EducationClassEnrollment)
      .delete({ classroom: { id: assignedClass.id } });
    expect(await service.sessionDetail(actor, marked.sessionId)).toMatchObject({
      expected: 2,
      unmarked: 1,
      rosterComplete: true,
      roster: expect.arrayContaining([
        expect.objectContaining({ id: member.id, name: "Unmarked member" }),
      ]),
    });
  });

  it("retrieves immutable roster and staff snapshots after membership and timetable changes", async () => {
    const roster = [
      {
        id: studentA.id,
        name: "Original name",
        nationalCode: null,
        userId: null,
      },
    ];
    const session = await db.getRepository(AttendanceSession).save({
      organization: orgA,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: new Date("2026-10-11T05:00:00Z"),
      occurrenceKey: "class_schedule:test:2026-10-11",
      assignedStaff: { id: actor.id },
      assignedStaffNameSnapshot: "Original teacher",
      titleSnapshot: "Original lesson",
      rosterSnapshot: roster,
      status: "submitted",
      revision: 3,
    });
    assignedClass.advisor = null;
    await db.getRepository(EducationClass).save(assignedClass);
    await db
      .getRepository(EducationClassEnrollment)
      .delete({ classroom: { id: assignedClass.id } });
    const teacher = { ...actor, role: "TEACHER", roles: ["TEACHER"] };
    expect(await service.sessionDetail(teacher, session.id)).toMatchObject({
      title: "Original lesson",
      assignedStaffName: "Original teacher",
      roster,
      expected: 1,
      unmarked: 1,
      rosterComplete: true,
      status: "submitted",
      revision: 3,
      canManage: false,
      canCorrect: false,
    });
    await expect(
      service.bulkMark(teacher, {
        organizationId: orgA.id,
        sessionId: session.id,
        entries: [{ studentId: studentA.id, status: "present" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_SESSION_WORKFLOW_REQUIRED" } },
    });
  });

  it("denies foreign, stale-organization and unassigned saved-session/history reads", async () => {
    const foreign = await db.getRepository(AttendanceSession).save({
      organization: orgB,
      contextType: "class",
      contextId: foreignClass.id,
      sessionDate: new Date(),
    });
    await expect(
      service.sessionDetail(actor, foreign.id),
    ).rejects.toBeDefined();
    await expect(
      service.sessionHistory(actor, foreign.id),
    ).rejects.toBeDefined();
    const local = await service.createSession(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: "2026-10-11T05:00:00Z",
    });
    await expect(
      service.sessionDetail(
        { ...actor, activeOrganizationId: orgB.id },
        local.id,
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_WORK_CONTEXT_MISMATCH" } },
    });
    assignedClass.advisor = null;
    await db.getRepository(EducationClass).save(assignedClass);
    await expect(
      service.sessionDetail(
        { ...actor, role: "TEACHER", roles: ["TEACHER"] },
        local.id,
      ),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
    await expect(
      service.sessionDetail(
        { ...actor, capabilities: ["attendance.self.read"] },
        local.id,
      ),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });

  it.each(["PRINCIPAL", "SCHOOL_SUPERVISOR", "PLATFORM_ADMIN"])(
    "denies foreign class/group/room writes for %s before persistence",
    async (role) => {
      actor = { ...actor, role, roles: [role] };
      for (const [contextType, contextId] of [
        ["class", foreignClass.id],
        ["class_group", foreignGroup.id],
        ["dorm", foreignRoom.id],
      ] as const) {
        const body = {
          organizationId: orgA.id,
          contextType,
          contextId,
          sessionDate: "2026-10-11T05:00:00Z",
        };
        await expect(service.createSession(actor, body)).rejects.toMatchObject({
          response: {
            error: { code: "ATTENDANCE_CONTEXT_ORGANIZATION_MISMATCH" },
          },
        });
        await expect(
          service.bulkMark(actor, {
            ...body,
            entries: [{ studentId: studentB.id, status: "present" }],
          }),
        ).rejects.toMatchObject({
          response: {
            error: { code: "ATTENDANCE_CONTEXT_ORGANIZATION_MISMATCH" },
          },
        });
      }
      expect(await db.getRepository(AttendanceSession).count()).toBe(0);
      expect(await db.getRepository(AttendanceRecord).count()).toBe(0);
      expect(emit).not.toHaveBeenCalled();
    },
  );

  it("rejects a foreign session ID instead of silently creating a replacement", async () => {
    const session = await db.getRepository(AttendanceSession).save({
      organization: orgB,
      contextType: "class",
      contextId: foreignClass.id,
      sessionDate: new Date(),
    });
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        sessionId: session.id,
        contextType: "class",
        contextId: assignedClass.id,
        entries: [{ studentId: studentA.id, status: "present" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_SESSION_NOT_FOUND" } },
    });
    expect(await db.getRepository(AttendanceSession).count()).toBe(1);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(0);
  });

  it("rejects a foreign context hidden inside an already scoped session", async () => {
    const session = await db.getRepository(AttendanceSession).save({
      organization: orgA,
      contextType: "dorm",
      contextId: foreignRoom.id,
      sessionDate: new Date(),
    });
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        sessionId: session.id,
        entries: [{ studentId: studentB.id, status: "absent" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_CONTEXT_ORGANIZATION_MISMATCH" } },
    });
    expect(await db.getRepository(AttendanceRecord).count()).toBe(0);
  });

  it("allows an assigned teacher's own classroom while denying an unassigned classroom", async () => {
    actor = { ...actor, role: "TEACHER", roles: ["TEACHER"] };
    const body = {
      organizationId: orgA.id,
      contextType: "class" as const,
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "present" as const }],
    };
    await expect(service.bulkMark(actor, body)).resolves.toMatchObject({
      count: 1,
    });
    assignedClass.advisor = null;
    await db.getRepository(EducationClass).save(assignedClass);
    await expect(
      service.createSession(actor, {
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        sessionDate: "2026-10-11T05:00:00Z",
      }),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });

  it("does not reveal a foreign roster on reads", async () => {
    await expect(
      service.listParticipants(actor, "class", foreignClass.id),
    ).rejects.toMatchObject({
      response: { error: { code: "ORGANIZATION_FORBIDDEN" } },
    });
  });
  it("validates every student before creating a session", async () => {
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        entries: [
          { studentId: studentA.id, status: "present" },
          { studentId: studentB.id, status: "absent" },
        ],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_STUDENT_NOT_IN_CONTEXT" } },
    });
    expect(await db.getRepository(AttendanceSession).count()).toBe(0);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(0);
    expect(emit).not.toHaveBeenCalled();
  });

  it("rejects duplicate students and overlarge batches before persistence", async () => {
    const entry = { studentId: studentA.id, status: "present" as const };
    const body = {
      organizationId: orgA.id,
      contextType: "class" as const,
      contextId: assignedClass.id,
    };
    await expect(
      service.bulkMark(actor, { ...body, entries: [entry, entry] }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_DUPLICATE_STUDENT" } },
    });
    await expect(
      service.bulkMark(actor, {
        ...body,
        entries: Array.from({ length: 501 }, () => entry),
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_BATCH_SIZE" } },
    });
    expect(await db.getRepository(AttendanceSession).count()).toBe(0);
  });

  it("rolls back the session and every row when the database rejects a later mark", async () => {
    const second = await db
      .getRepository(Student)
      .save({ name: "Second A", organization: orgA });
    await db
      .getRepository(EducationClassEnrollment)
      .save({ classroom: assignedClass, student: second });
    await db.query(
      `CREATE TRIGGER fail_second_mark BEFORE INSERT ON attendance_records WHEN NEW.studentId = '${second.id}' BEGIN SELECT RAISE(ABORT, 'test storage failure'); END`,
    );
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        entries: [
          { studentId: studentA.id, status: "present" },
          { studentId: second.id, status: "absent" },
        ],
      }),
    ).rejects.toThrow("test storage failure");
    expect(await db.getRepository(AttendanceSession).count()).toBe(0);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(0);
    expect(emit).not.toHaveBeenCalled();
    await db.query("DROP TRIGGER fail_second_mark");
    // A failed transaction must not poison the serialized writer queue.
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        entries: [{ studentId: studentA.id, status: "present" }],
      }),
    ).resolves.toMatchObject({ count: 1 });
  });

  it("rolls back changes to an existing record when a later insert fails", async () => {
    const second = await db
      .getRepository(Student)
      .save({ name: "Second A", organization: orgA });
    await db
      .getRepository(EducationClassEnrollment)
      .save({ classroom: assignedClass, student: second });
    const saved = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "present" }],
    });
    emit.mockClear();
    await db.query(
      `CREATE TRIGGER fail_second_mark BEFORE INSERT ON attendance_records WHEN NEW.studentId = '${second.id}' BEGIN SELECT RAISE(ABORT, 'test storage failure'); END`,
    );
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        sessionId: saved.sessionId,
        entries: [
          { studentId: studentA.id, status: "absent", note: "Changed draft" },
          { studentId: second.id, status: "present" },
        ],
      }),
    ).rejects.toThrow("test storage failure");
    const record = await db
      .getRepository(AttendanceRecord)
      .findOneByOrFail({ student: { id: studentA.id } });
    expect(record.status).toBe("present");
    expect(record.note).toBe("");
    expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    expect(emit).not.toHaveBeenCalled();
  });

  it("serializes simultaneous attendance writes without nested SQLite transactions", async () => {
    const session = await service.createSession(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: "2026-10-11T05:00:00Z",
    });
    await expect(
      Promise.all([
        service.bulkMark(actor, {
          organizationId: orgA.id,
          sessionId: session.id,
          entries: [{ studentId: studentA.id, status: "present" }],
        }),
        service.bulkMark(actor, {
          organizationId: orgA.id,
          sessionId: session.id,
          entries: [{ studentId: studentA.id, status: "late" }],
        }),
      ]),
    ).resolves.toHaveLength(2);
    expect(await db.getRepository(AttendanceSession).count()).toBe(1);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    expect(emit.mock.calls[0][2]).toMatchObject({
      contextId: assignedClass.id,
      contextType: "class",
      organizationId: orgA.id,
    });
  });

  it("does not reuse active-organization authority in another membership", async () => {
    await db
      .getRepository(OrganizationMembership)
      .save({ organization: orgB, user: { id: actor.id } });
    await expect(
      service.bulkMark(actor, {
        organizationId: orgB.id,
        contextType: "class",
        contextId: foreignClass.id,
        entries: [{ studentId: studentB.id, status: "present" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_WORK_CONTEXT_MISMATCH" } },
    });
    expect(await db.getRepository(AttendanceSession).count()).toBe(0);
  });
  it("enforces read/manage capabilities and bounded DTO validation over HTTP", async () => {
    const module = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [{ provide: AttendanceService, useValue: service }],
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
    // Authentication is represented by the fixture actor; the real controller,
    // capability guard, DTO pipeline and database service handle each request.
    app
      .getHttpAdapter()
      .getInstance()
      .addHook("preHandler", async (request: FastifyRequest) => {
        (request as FastifyRequest & { user: AuthenticatedUser }).user = actor;
      });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    try {
      const body = {
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        entries: [{ studentId: studentA.id, status: "present" }],
      };
      actor.capabilities = ["attendance.read"];
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/api/v2/attendance/contexts",
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/api/v2/attendance/bulk-mark",
            payload: body,
          })
        ).statusCode,
      ).toBe(403);
      expect(await db.getRepository(AttendanceSession).count()).toBe(0);
      actor.capabilities = ["attendance.read", "attendance.manage"];
      const duplicate = await app.inject({
        method: "POST",
        url: "/api/v2/attendance/bulk-mark",
        payload: { ...body, entries: [body.entries[0], body.entries[0]] },
      });
      expect(duplicate.statusCode).toBe(400);
      expect(await db.getRepository(AttendanceSession).count()).toBe(0);
      const allowed = await app.inject({
        method: "POST",
        url: "/api/v2/attendance/bulk-mark",
        payload: body,
      });
      expect(allowed.statusCode).toBe(201);
      expect(allowed.json()).toMatchObject({ ok: true, data: { count: 1 } });
      actor = {
        ...actor,
        role: "STUDENT",
        roles: ["STUDENT"],
        capabilities: ["attendance.self.read"],
      };
      expect(
        (
          await app.inject({
            method: "GET",
            url: "/api/v2/attendance/contexts",
          })
        ).statusCode,
      ).toBe(403);
      expect(
        (
          await app.inject({
            method: "POST",
            url: "/api/v2/attendance/bulk-mark",
            payload: body,
          })
        ).statusCode,
      ).toBe(403);
      expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    } finally {
      await app.close();
    }
  });
  it("replays a committed request without duplicating the session, marks or event", async () => {
    const body = {
      requestId: randomUUID(),
      organizationId: orgA.id,
      contextType: "class" as const,
      contextId: assignedClass.id,
      entries: [
        { studentId: studentA.id, status: "absent" as const, note: "Reason" },
      ],
    };
    const committed = await service.bulkMark(actor, body);
    expect(await service.bulkMark(actor, body)).toEqual(committed);
    expect(await db.getRepository(AttendanceSession).count()).toBe(1);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    expect(await db.getRepository(AttendanceWriteReceipt).count()).toBe(1);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("rejects reuse of a request ID for different marks", async () => {
    const body = {
      requestId: randomUUID(),
      organizationId: orgA.id,
      contextType: "class" as const,
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "present" as const }],
    };
    await service.bulkMark(actor, body);
    await expect(
      service.bulkMark(actor, {
        ...body,
        entries: [{ studentId: studentA.id, status: "absent" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_REQUEST_REUSED" } },
    });
    expect(
      (
        await db
          .getRepository(AttendanceRecord)
          .findOneByOrFail({ student: { id: studentA.id } })
      ).status,
    ).toBe("present");
  });

  it("deduplicates simultaneous retry requests on SQLite", async () => {
    const body = {
      requestId: randomUUID(),
      organizationId: orgA.id,
      contextType: "class" as const,
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "present" as const }],
    };
    const [first, second] = await Promise.all([
      service.bulkMark(actor, body),
      service.bulkMark(actor, body),
    ]);
    expect(second).toEqual(first);
    expect(await db.getRepository(AttendanceSession).count()).toBe(1);
    expect(await db.getRepository(AttendanceWriteReceipt).count()).toBe(1);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("rechecks staff assignment before replaying a prior response", async () => {
    actor = { ...actor, role: "TEACHER", roles: ["TEACHER"] };
    const body = {
      requestId: randomUUID(),
      organizationId: orgA.id,
      contextType: "class" as const,
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "present" as const }],
    };
    await service.bulkMark(actor, body);
    assignedClass.advisor = null;
    await db.getRepository(EducationClass).save(assignedClass);
    await expect(service.bulkMark(actor, body)).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
    expect(await db.getRepository(AttendanceSession).count()).toBe(1);
  });

  it("does not commit a receipt if its attendance transaction fails", async () => {
    const second = await db
      .getRepository(Student)
      .save({ name: "Second A", organization: orgA });
    await db
      .getRepository(EducationClassEnrollment)
      .save({ classroom: assignedClass, student: second });
    const body = {
      requestId: randomUUID(),
      organizationId: orgA.id,
      contextType: "class" as const,
      contextId: assignedClass.id,
      entries: [
        { studentId: studentA.id, status: "present" as const },
        { studentId: second.id, status: "present" as const },
      ],
    };
    await db.query(
      `CREATE TRIGGER fail_second_mark BEFORE INSERT ON attendance_records WHEN NEW.studentId = '${second.id}' BEGIN SELECT RAISE(ABORT, 'test storage failure'); END`,
    );
    await expect(service.bulkMark(actor, body)).rejects.toThrow(
      "test storage failure",
    );
    expect(await db.getRepository(AttendanceWriteReceipt).count()).toBe(0);
    await db.query("DROP TRIGGER fail_second_mark");
    await expect(service.bulkMark(actor, body)).resolves.toMatchObject({
      count: 2,
    });
    expect(await db.getRepository(AttendanceSession).count()).toBe(1);
  });

  it("adds and reverses the receipt migration without rewriting existing attendance", async () => {
    const body = {
      organizationId: orgA.id,
      contextType: "class" as const,
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "present" as const }],
    };
    const old = await service.bulkMark(actor, body);
    await db.query("DROP TABLE attendance_write_receipts");
    const runner = db.createQueryRunner();
    const migration = new AttendanceWriteReceipts1730100000000();
    await migration.up(runner);
    const result = await service.bulkMark(actor, {
      ...body,
      requestId: randomUUID(),
      sessionId: old.sessionId,
    });
    expect(result.sessionId).toBe(old.sessionId);
    expect(await db.getRepository(AttendanceWriteReceipt).count()).toBe(1);
    await migration.down(runner);
    expect(await db.getRepository(AttendanceSession).count()).toBe(1);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    await migration.up(runner);
    expect(await db.getRepository(AttendanceWriteReceipt).count()).toBe(0);
    await runner.release();
  });
  it("does not let a legacy principal role bypass a selected teacher role", async () => {
    actor = {
      ...actor,
      role: "PRINCIPAL",
      roles: ["TEACHER"],
      capabilities: ["attendance.manage", "attendance.review"],
    };
    assignedClass.advisor = null;
    await db.getRepository(EducationClass).save(assignedClass);
    await expect(
      service.createSession(actor, {
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        sessionDate: "2026-10-11T05:00:00Z",
      }),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
    await expect(service.listAbsenceReviews(actor)).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
    expect(await db.getRepository(AttendanceSession).count()).toBe(0);
  });
  it("keeps teacher study-group writes assigned and denies even an own-school dorm", async () => {
    actor = { ...actor, role: "TEACHER", roles: ["TEACHER"] };
    const group: StudyGroup = await db.getRepository(StudyGroup).save({
      organization: orgA,
      classroom: assignedClass,
      code: "OWN-G",
      name: "Assigned group",
    });
    await db
      .getRepository(StudyGroupMembership)
      .save({ group, student: studentA });
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        contextType: "class_group",
        contextId: group.id,
        entries: [{ studentId: studentA.id, status: "present" }],
      }),
    ).resolves.toMatchObject({ count: 1 });
    const room = await db
      .getRepository(DormRoom)
      .save({ organization: orgA, code: "OWN-R", name: "Own school room" });
    await db
      .getRepository(DormRoomAssignment)
      .save({ room, student: studentA });
    await expect(
      service.createSession(actor, {
        organizationId: orgA.id,
        contextType: "dorm",
        contextId: room.id,
        sessionDate: "2026-10-11T05:00:00Z",
      }),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
    group.classroom = null;
    await db.getRepository(StudyGroup).save(group);
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        contextType: "class_group",
        contextId: group.id,
        entries: [{ studentId: studentA.id, status: "absent" }],
      }),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
    expect(await db.getRepository(AttendanceSession).count()).toBe(1);
  });
  it("allows only one concurrent decision and records its before/after audit history", async () => {
    const mark = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent", note: "Illness" }],
    });
    emit.mockClear();
    const decisions = await Promise.allSettled([
      service.reviewAbsence(actor, mark.records[0].id, {
        decision: "approved",
        note: "Evidence reviewed",
      }),
      service.reviewAbsence(actor, mark.records[0].id, {
        decision: "rejected",
        note: "Other decision",
      }),
    ]);
    expect(decisions[0].status).toBe("fulfilled");
    expect(decisions[1]).toMatchObject({
      status: "rejected",
      reason: { response: { error: { code: "ATTENDANCE_REVIEW_CLOSED" } } },
    });
    const record = await db
      .getRepository(AttendanceRecord)
      .findOneByOrFail({ id: mark.records[0].id });
    expect(record.status).toBe("excused"); // legacy compatibility until the explicit physical-status migration
    expect(record.reviewStatus).toBe("approved");
    expect(record.reviewNote).toBe("Evidence reviewed");
    const audits = await db.getRepository(AuditLog).findBy({
      action: "attendance.absence.reviewed",
      organizationId: orgA.id,
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].metadata).toMatchObject({
      actorId: actor.id,
      recordId: record.id,
      before: { status: "absent", reviewStatus: "pending" },
      after: { status: "excused", reviewStatus: "approved" },
    });
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("rolls a review back if its audit write fails and permits a safe retry", async () => {
    const mark = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent" }],
    });
    emit.mockClear();
    await db.query(
      "CREATE TRIGGER fail_review_audit BEFORE INSERT ON audit_logs WHEN NEW.action = 'attendance.absence.reviewed' BEGIN SELECT RAISE(ABORT, 'test audit failure'); END",
    );
    await expect(
      service.reviewAbsence(actor, mark.records[0].id, {
        decision: "approved",
      }),
    ).rejects.toThrow("test audit failure");
    expect(
      await db
        .getRepository(AttendanceRecord)
        .findOneByOrFail({ id: mark.records[0].id }),
    ).toMatchObject({
      status: "absent",
      reviewStatus: "pending",
      reviewNote: "",
    });
    expect(emit).not.toHaveBeenCalled();
    await db.query("DROP TRIGGER fail_review_audit");
    await expect(
      service.reviewAbsence(actor, mark.records[0].id, {
        decision: "approved",
      }),
    ).resolves.toMatchObject({ reviewStatus: "approved" });
  });

  it("denies a review in another active organization before changing the record", async () => {
    const mark = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent" }],
    });
    await expect(
      service.reviewAbsence(
        { ...actor, activeOrganizationId: orgB.id },
        mark.records[0].id,
        { decision: "approved" },
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_WORK_CONTEXT_MISMATCH" } },
    });
    expect(
      (
        await db
          .getRepository(AttendanceRecord)
          .findOneByOrFail({ id: mark.records[0].id })
      ).reviewStatus,
    ).toBe("pending");
  });

  it("refreshes authorized peer reviewers without broadcasting the decision to unrelated members", async () => {
    const users = db.getRepository(User);
    const reviewer = await users.save({
      username: "peer-reviewer",
      passwordHash: "not-a-login-hash",
      role: UserRole.TEACHER,
    });
    const unrelated = await users.save({
      username: "unrelated-student",
      passwordHash: "not-a-login-hash",
      role: UserRole.STUDENT,
    });
    const member = await db
      .getRepository(OrganizationMembership)
      .save({ organization: orgA, user: reviewer });
    await db
      .getRepository(OrganizationMembership)
      .save({ organization: orgA, user: unrelated });
    const role = await db.getRepository(Role).save({
      code: "SCHOOL_SUPERVISOR",
      name: "Supervisor",
      organizationScoped: true,
    });
    const permission = await db
      .getRepository(Permission)
      .save({ code: "attendance.review", description: "Review attendance" });
    await db.getRepository(RolePermission).save({ role, permission });
    await db
      .getRepository(UserRoleAssignment)
      .save({ user: reviewer, membership: member, role });
    const mark = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent" }],
    });
    emit.mockClear();
    await service.reviewAbsence(actor, mark.records[0].id, {
      decision: "approved",
    });
    expect(emit.mock.calls[0][0]).toEqual(
      expect.arrayContaining([actor.id, reviewer.id]),
    );
    expect(emit.mock.calls[0][0]).not.toContain(unrelated.id);
  });
});

describe("Attendance HTTP batch validation", () => {
  const body = {
    organizationId: randomUUID(),
    contextType: "class",
    contextId: randomUUID(),
  };
  const entry = { studentId: randomUUID(), status: "present" };
  it("rejects empty, duplicate, and overlarge request arrays", async () => {
    for (const entries of [
      [],
      [entry, entry],
      Array.from({ length: 501 }, () => ({
        ...entry,
        studentId: randomUUID(),
      })),
    ]) {
      const errors = await validate(
        plainToInstance(BulkMarkAttendanceDto, { ...body, entries }),
      );
      expect(
        errors.find((error) => error.property === "entries")?.constraints,
      ).toBeDefined();
    }
  });
  it("accepts the maximum batch while still validating nested marks", async () => {
    const entries = Array.from({ length: 500 }, () => ({
      ...entry,
      studentId: randomUUID(),
    }));
    expect(
      await validate(
        plainToInstance(BulkMarkAttendanceDto, { ...body, entries }),
      ),
    ).toHaveLength(0);
    entries[499].status = "invented";
    expect(
      await validate(
        plainToInstance(BulkMarkAttendanceDto, { ...body, entries }),
      ),
    ).not.toHaveLength(0);
  });
});
