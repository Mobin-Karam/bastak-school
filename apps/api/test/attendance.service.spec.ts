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
import { Notification } from "../src/database/entities/notification.entity";
import { StudentRewardLedger } from "../src/database/entities/student-reward-ledger.entity";
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
import { RewardsService } from "../src/modules/rewards";
import type { AuthenticatedUser } from "../src/modules/auth";
import {
  AttendanceRecord,
  AttendanceReviewStatus,
  AttendanceStatus,
} from "../src/database/entities/attendance-record.entity";
import { AttendanceCorrection } from "../src/database/entities/attendance-correction.entity";
import { AttendancePolicy } from "../src/database/entities/attendance-policy.entity";
import { AttendanceSession } from "../src/database/entities/attendance-session.entity";
import { AttendanceSupervisorCheck } from "../src/database/entities/attendance-supervisor-check.entity";
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
import { EducationBook } from "../src/database/entities/education-book.entity";
import {
  SchoolAcademicTerm,
  SchoolAcademicYear,
} from "../src/database/entities/school-academic-year.entity";

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
  let staff: User;
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
    staff = await db.getRepository(User).save({
      username: "attendance-test-staff",
      passwordHash: "not-a-login-hash",
      role: UserRole.TEACHER,
    });
    await db
      .getRepository(OrganizationMembership)
      .save({ organization: orgA, user: staff });
    actor = {
      id: staff.id,
      username: staff.username,
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
          advisor: staff,
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
      new RewardsService(
        db.getRepository(StudentRewardLedger),
        db.getRepository(Student),
        db.getRepository(AuditLog),
        new SchoolAccessService(
          organizations,
          db.getRepository(OrganizationMembership),
        ),
        {} as AuthorizationService,
      ),
      db.getRepository(AttendanceSupervisorCheck),
    );
  });
  afterEach(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it("keeps organization-wide academic access separate from dorm access", async () => {
    const room = await db.getRepository(DormRoom).save({
      organization: orgA,
      code: "A-1",
      name: "Room A",
    });
    await db
      .getRepository(DormRoomAssignment)
      .save({ room, student: studentA });
    const academicManager = {
      ...actor,
      role: "RELIGIOUS_EDUCATION_MANAGER",
      roles: ["RELIGIOUS_EDUCATION_MANAGER"],
    };

    const contexts = await service.listContexts(academicManager);
    expect(contexts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: assignedClass.id, contextType: "class" }),
      ]),
    );
    expect(contexts).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: room.id, contextType: "dorm" }),
      ]),
    );
    await expect(
      service.bulkMark(academicManager, {
        organizationId: orgA.id,
        contextType: "dorm",
        contextId: room.id,
        entries: [{ studentId: studentA.id, status: "present" }],
      }),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });

  it("persists a manually reconciled historical session with academic snapshots and an audit trail", async () => {
    const year = await db.getRepository(SchoolAcademicYear).save({
      organizationId: orgA.id,
      name: "۱۴۰۵–۱۴۰۶",
      startsOn: "2026-09-23",
      endsOn: "2027-06-22",
      state: "ACTIVE",
    });
    const term = await db.getRepository(SchoolAcademicTerm).save({
      academicYearId: year.id,
      name: "نیم‌سال اول",
      startsOn: "2026-09-23",
      endsOn: "2027-01-31",
      state: "ACTIVE",
    });
    const book = await db.getRepository(EducationBook).save({
      id: randomUUID(),
      country: "IR",
      schoolYear: "1405-1406",
      grade: 1,
      level: "school",
      branch: "general",
      track: "general",
      category: "general",
      titleFa: "کتاب آزمون",
      titleEn: "Test Book",
      appliesTo: ["school"],
      organizationId: orgA.id,
    });
    const result = await service.createHistoricalSession(actor, {
      organizationId: orgA.id,
      academicYearId: year.id,
      termId: term.id,
      classroomId: assignedClass.id,
      teacherId: staff.id,
      subjectId: book.id,
      title: "جلسه جبرانی",
      date: "2026-10-12",
      reason: "برنامهٔ قدیمی ثبت نشده بود",
    });
    const session = await db.getRepository(AttendanceSession).findOneByOrFail({ id: result.id });
    expect(session).toMatchObject({
      sourceKind: "legacy_import",
      academicYearIdSnapshot: year.id,
      academicYearNameSnapshot: year.name,
      termIdSnapshot: term.id,
      termNameSnapshot: term.name,
      subjectIdSnapshot: book.id,
      subjectNameSnapshot: book.titleFa,
    });
    expect(await db.getRepository(AuditLog).countBy({ action: "attendance.historical_session.created" })).toBe(1);
    await db.getRepository(SchoolAcademicTerm).update(
      { id: term.id },
      { state: "ARCHIVED", correctionOpen: true },
    );
    await expect(
      service.createHistoricalSession(actor, {
        organizationId: orgA.id,
        academicYearId: year.id,
        termId: term.id,
        classroomId: assignedClass.id,
        teacherId: staff.id,
        subjectId: book.id,
        title: "جلسهٔ جدید ممنوع",
        date: "2026-10-13",
        reason: "نباید ثبت شود",
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("keeps a supervisor observation independent and editable for one teacher occurrence", async () => {
    const session = await db.getRepository(AttendanceSession).save({
      organization: orgA,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: new Date("2026-10-28T08:00:00.000Z"),
      sourceKind: "class_schedule",
      occurrenceKey: `supervisor-check:${randomUUID()}`,
      titleSnapshot: assignedClass.name,
      rosterSnapshot: [
        {
          id: studentA.id,
          name: studentA.name,
          nationalCode: null,
          userId: null,
        },
      ],
    });
    const supervisor = {
      ...actor,
      roles: ["SCHOOL_SUPERVISOR"],
      role: "SCHOOL_SUPERVISOR",
    };
    const created = await service.saveSupervisorCheck(supervisor, session.id, {
      entries: [{ studentId: studentA.id, status: "absent" }],
    });
    const updated = await service.saveSupervisorCheck(supervisor, session.id, {
      expectedRevision: created.revision,
      entries: [{ studentId: studentA.id, status: "present" }],
    });

    expect(updated.revision).toBe(1);
    expect(updated.entries).toEqual([
      { studentId: studentA.id, status: "present", note: "" },
    ]);
    expect(
      await db
        .getRepository(AttendanceRecord)
        .count({ where: { session: { id: session.id } } }),
    ).toBe(0);
    expect(
      await db
        .getRepository(AttendanceSupervisorCheck)
        .count({ where: { session: { id: session.id } } }),
    ).toBe(1);
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

  it("records a direct excused mark with an optional teacher note", async () => {
    const marked = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "excused" }],
    });
    expect(marked.records).toEqual([
      expect.objectContaining({
        studentId: studentA.id,
        status: "excused",
        note: "",
      }),
    ]);
    expect(await db.getRepository(AttendanceRecord).count()).toBe(1);
    expect(await db.getRepository(AttendanceSession).count()).toBe(1);
    expect(emit).toHaveBeenCalled();
  });

  it("returns saved records with unknown legacy roster totals rather than today's membership", async () => {
    const marked = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent", note: "Illness" }],
    });
    // Model a pre-snapshot session; new manual sessions now capture their full roster.
    await db.getRepository(AttendanceSession).update(marked.sessionId, {
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

  it("pages scoped session history with bounded results", async () => {
    await db.getRepository(AttendanceSession).save([
      {
        organization: orgA,
        contextType: "class",
        contextId: assignedClass.id,
        sessionDate: new Date("2026-10-10T08:00:00Z"),
        titleSnapshot: "قدیمی",
      },
      {
        organization: orgA,
        contextType: "class",
        contextId: assignedClass.id,
        sessionDate: new Date("2026-10-11T08:00:00Z"),
        titleSnapshot: "جدید",
      },
    ]);
    const history = await service.paginatedSessions(actor, {
      page: 1,
      limit: 1,
    });
    expect(history).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      hasNext: true,
    });
    expect(history.items).toHaveLength(1);
    expect(history.items[0].title).toBe("جدید");
    await expect(
      service.paginatedSessions(actor, {
        page: 1,
        limit: 25,
        contextType: "class",
        contextId: assignedClass.id,
        from: "2026-10-11T00:00:00.000Z",
      }),
    ).resolves.toMatchObject({
      total: 1,
      hasNext: false,
      items: [expect.objectContaining({ title: "جدید" })],
    });
  });

  it("paginates only a teacher's assigned contexts", async () => {
    const unassignedClass = await db.getRepository(EducationClass).save({
      organization: orgA,
      code: "UNASSIGNED",
      name: "Unassigned class",
      schoolYear: "1405",
      gradeId: 1,
      educationTypeId: "school",
      trackId: "general",
    });
    await db.getRepository(AttendanceSession).save([
      {
        organization: orgA,
        contextType: "class",
        contextId: unassignedClass.id,
        sessionDate: new Date("2026-10-12T08:00:00Z"),
        titleSnapshot: "غیرمجاز",
      },
      {
        organization: orgA,
        contextType: "class",
        contextId: assignedClass.id,
        sessionDate: new Date("2026-10-11T08:00:00Z"),
        titleSnapshot: "مجاز",
      },
    ]);
    const history = await service.paginatedSessions(
      { ...actor, role: "TEACHER", roles: ["TEACHER"] },
      { page: 1, limit: 1 },
    );
    expect(history).toMatchObject({ total: 1, hasNext: false });
    expect(history.items).toEqual([
      expect.objectContaining({ title: "مجاز", contextId: assignedClass.id }),
    ]);
  });

  it("returns a student's own non-cancelled history without crossing organizations", async () => {
    const studentUser = await db.getRepository(User).save({
      username: "student-history",
      passwordHash: "not-a-login-hash",
      role: UserRole.STUDENT,
    });
    await db
      .getRepository(OrganizationMembership)
      .save({ organization: orgA, user: studentUser });
    studentA.user = studentUser;
    await db.getRepository(Student).save(studentA);
    const recorded = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent" }],
    });
    await db.getRepository(AttendanceSession).save({
      organization: orgB,
      contextType: "class",
      contextId: foreignClass.id,
      sessionDate: new Date(),
      status: "submitted",
      records: [],
    });
    const history = await service.listSelfRecords({
      id: studentUser.id,
      username: studentUser.username,
      role: "STUDENT",
      roles: ["STUDENT"],
      capabilities: ["attendance.self.read"],
      sessionId: "student-history",
      organizationIds: [orgA.id],
      activeOrganizationId: orgA.id,
    });
    expect(history).toEqual([
      expect.objectContaining({
        id: recorded.records[0].id,
        organizationId: orgA.id,
      }),
    ]);
  });

  it("keeps a marker's absence-review history inside the active organization", async () => {
    const account = await db
      .getRepository(User)
      .findOneByOrFail({ id: actor.id });
    await db
      .getRepository(OrganizationMembership)
      .save({ organization: orgB, user: account });
    const [localSession, foreignSession] = await db
      .getRepository(AttendanceSession)
      .save([
        {
          organization: orgA,
          contextType: "class",
          contextId: assignedClass.id,
          sessionDate: new Date(),
          status: "submitted",
        },
        {
          organization: orgB,
          contextType: "class",
          contextId: foreignClass.id,
          sessionDate: new Date(),
          status: "submitted",
        },
      ]);
    const [local, foreign] = await db.getRepository(AttendanceRecord).save([
      {
        session: localSession,
        student: studentA,
        recordedBy: account,
        status: AttendanceStatus.ABSENT,
        reviewStatus: AttendanceReviewStatus.PENDING,
      },
      {
        session: foreignSession,
        student: studentB,
        recordedBy: account,
        status: AttendanceStatus.ABSENT,
        reviewStatus: AttendanceReviewStatus.PENDING,
      },
    ]);
    await expect(service.listMyAbsenceReviews(actor)).resolves.toEqual([
      expect.objectContaining({ id: local.id, organizationId: orgA.id }),
    ]);
    expect(foreign.id).toBeTruthy();
  });

  it("enforces the organization partial-submission policy on the server", async () => {
    const member = await db.getRepository(Student).save({
      organization: orgA,
      name: "Second member",
    });
    await db.getRepository(EducationClassEnrollment).save({
      classroom: assignedClass,
      student: member,
    });
    const administrator = {
      ...actor,
      capabilities: [
        ...(actor.capabilities ?? []),
        "attendance.settings.manage",
      ],
    };
    await service.updatePolicy(administrator, {
      organizationId: orgA.id,
      timeZone: "Asia/Tehran",
      dayStartsAt: "04:00",
      allowPartialSubmission: false,
      lateCountsAsPresent: true,
    });
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        entries: [{ studentId: studentA.id, status: "present" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_PARTIAL_SUBMISSION_DISABLED" } },
    });
    expect(
      (await service.policy(administrator, orgA.id)).allowPartialSubmission,
    ).toBe(false);
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

  it("preserves the timetable subject snapshot when creating a lesson session", async () => {
    const created = await service.createTimetableSession(actor, {
      organizationId: orgA.id,
      classroomId: assignedClass.id,
      lessonId: randomUUID(),
      date: "2026-10-11",
      title: "پایه سوم · فقه",
      subjectId: "book-fiqh",
      subjectName: "فقه",
      academicYearId: "year-1405",
      academicYearName: "سال تحصیلی ۱۴۰۵",
      termId: "term-one",
      termName: "نیم‌سال اول",
      startsAt: "2026-10-11T04:30:00.000Z",
      endsAt: "2026-10-11T05:15:00.000Z",
      timeZone: "Asia/Tehran",
      teacherId: null,
    });
    await expect(
      db.getRepository(AttendanceSession).findOneByOrFail({ id: created.id }),
    ).resolves.toMatchObject({
      subjectIdSnapshot: "book-fiqh",
      subjectNameSnapshot: "فقه",
      academicYearIdSnapshot: "year-1405",
      academicYearNameSnapshot: "سال تحصیلی ۱۴۰۵",
      termIdSnapshot: "term-one",
      termNameSnapshot: "نیم‌سال اول",
    });
    await expect(
      service.sessionDetail(actor, created.id),
    ).resolves.toMatchObject({
      subjectId: "book-fiqh",
      subjectName: "فقه",
      academicYearId: "year-1405",
      academicYearName: "سال تحصیلی ۱۴۰۵",
      termId: "term-one",
      termName: "نیم‌سال اول",
    });
    await expect(
      service.paginatedSessions(actor, {
        page: 1,
        limit: 25,
        subjectId: "book-fiqh",
      }),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        expect.objectContaining({ subjectId: "book-fiqh", subjectName: "فقه" }),
      ],
    });
  });

  it("submits an immutable roster absence-first in one revisioned, idempotent write", async () => {
    const lateMember = await db.getRepository(Student).save({
      organization: orgA,
      name: "Late member",
    });
    await db.getRepository(EducationClassEnrollment).save({
      classroom: assignedClass,
      student: lateMember,
    });
    const session = await db.getRepository(AttendanceSession).save({
      organization: orgA,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: new Date(),
      status: "open",
      revision: 4,
      titleSnapshot: "فقه",
      rosterSnapshot: [
        {
          id: studentA.id,
          name: studentA.name,
          nationalCode: null,
          userId: null,
        },
        {
          id: lateMember.id,
          name: lateMember.name,
          nationalCode: null,
          userId: null,
        },
      ],
    });
    const requestId = randomUUID();
    const body = {
      requestId,
      expectedRevision: 4,
      absentStudentIds: [studentA.id],
      lateStudentIds: [lateMember.id],
    };

    const committed = await service.submitAbsences(actor, session.id, body);
    expect(committed).toMatchObject({
      sessionId: session.id,
      count: 2,
      revision: 5,
      status: "submitted",
    });
    expect(await service.submitAbsences(actor, session.id, body)).toEqual(
      committed,
    );
    expect(
      (
        await db
          .getRepository(AttendanceRecord)
          .find({ where: { session: { id: session.id } } })
      )
        .map((record) => record.status)
        .sort(),
    ).toEqual(["absent", "late"]);
    await expect(
      service.submitAbsences(actor, session.id, {
        ...body,
        requestId: randomUUID(),
        expectedRevision: 5,
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_SESSION_ALREADY_SUBMITTED" } },
    });
  });

  it("records all 30 roster members as present after explicit all-present confirmation", async () => {
    const additional = await db.getRepository(Student).save(
      Array.from({ length: 29 }, (_, index) => ({
        organization: orgA,
        name: `All present ${index + 2}`,
      })),
    );
    await db
      .getRepository(EducationClassEnrollment)
      .save(
        additional.map((student) => ({ classroom: assignedClass, student })),
      );
    const roster = [studentA, ...additional];
    const session = await db.getRepository(AttendanceSession).save({
      organization: orgA,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: new Date(),
      status: "open",
      rosterSnapshot: roster.map((student) => ({
        id: student.id,
        name: student.name,
        nationalCode: null,
        userId: null,
      })),
    });
    const result = await service.submitAbsences(actor, session.id, {
      requestId: randomUUID(),
      expectedRevision: 0,
      absentStudentIds: [],
    });
    expect(result).toMatchObject({ count: 30, status: "submitted" });
    expect(
      await db.getRepository(AttendanceRecord).count({
        where: {
          session: { id: session.id },
          status: AttendanceStatus.PRESENT,
        },
      }),
    ).toBe(30);
  });

  it("rejects an absence-first overlap or an ID outside the session snapshot", async () => {
    const session = await db.getRepository(AttendanceSession).save({
      organization: orgA,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: new Date(),
      status: "open",
      rosterSnapshot: [
        {
          id: studentA.id,
          name: studentA.name,
          nationalCode: null,
          userId: null,
        },
      ],
    });
    await expect(
      service.submitAbsences(actor, session.id, {
        requestId: randomUUID(),
        expectedRevision: 0,
        absentStudentIds: [studentA.id],
        lateStudentIds: [studentA.id],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_STATUS_CONFLICT" } },
    });
    await expect(
      service.submitAbsences(actor, session.id, {
        requestId: randomUUID(),
        expectedRevision: 0,
        absentStudentIds: [studentB.id],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_STUDENT_NOT_IN_SESSION" } },
    });
    expect(await db.getRepository(AttendanceRecord).count()).toBe(0);
  });

  it("finalizes a submitted session and records a revisioned correction without reopening it", async () => {
    const marked = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent" }],
    });
    const reviewer = {
      ...actor,
      capabilities: [...(actor.capabilities ?? []), "attendance.review"],
    };
    const finalized = await service.finalizeSession(
      reviewer,
      marked.sessionId,
      {
        requestId: randomUUID(),
        expectedRevision: 1,
      },
    );
    expect(finalized).toMatchObject({ status: "finalized", revision: 2 });
    const correctedRequestId = randomUUID();
    const corrected = await service.correctRecord(
      {
        ...reviewer,
        capabilities: [...(reviewer.capabilities ?? []), "attendance.correct"],
      },
      marked.records[0].id,
      {
        requestId: correctedRequestId,
        expectedRevision: 1,
        status: "late",
        minutesLate: 10,
        reason: "ثبت زمان ورود",
      },
    );
    expect(corrected).toMatchObject({ revision: 2, sessionRevision: 3 });
    await expect(
      service.correctRecord(
        {
          ...reviewer,
          capabilities: [
            ...(reviewer.capabilities ?? []),
            "attendance.correct",
          ],
        },
        marked.records[0].id,
        {
          requestId: correctedRequestId,
          expectedRevision: 1,
          status: "late",
          minutesLate: 10,
          reason: "ثبت زمان ورود",
        },
      ),
    ).resolves.toEqual(corrected);
    expect(await db.getRepository(AttendanceCorrection).find()).toEqual([
      expect.objectContaining({ reason: "ثبت زمان ورود" }),
    ]);
    expect(await service.sessionDetail(actor, marked.sessionId)).toMatchObject({
      status: "finalized",
      revision: 3,
      records: [
        expect.objectContaining({ physicalStatus: "late", minutesLate: 10 }),
      ],
    });
    expect(await service.sessionHistory(actor, marked.sessionId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "attendance.session.finalized" }),
        expect.objectContaining({ action: "attendance.record.corrected" }),
      ]),
    );
  });

  it("lets the assigned teacher revise a finalized timetable occurrence without reopening it", async () => {
    const session = await db.getRepository(AttendanceSession).save({
      organization: orgA,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: new Date("2026-10-28T08:00:00.000Z"),
      sourceKind: "class_schedule",
      occurrenceKey: `finalized-teacher-edit:${randomUUID()}`,
      status: "finalized",
      assignedStaff: staff,
      rosterSnapshot: [
        {
          id: studentA.id,
          name: studentA.name,
          nationalCode: null,
          userId: null,
        },
      ],
    });
    const teacher = {
      ...actor,
      role: "TEACHER",
      roles: ["TEACHER"],
      capabilities: ["attendance.class.manage"],
    };

    const result = await service.submitAbsences(teacher, session.id, {
      requestId: randomUUID(),
      expectedRevision: 0,
      absentStudentIds: [studentA.id],
    });

    expect(result).toMatchObject({ status: "finalized", revision: 1 });
    expect(
      await db
        .getRepository(AttendanceRecord)
        .findOneByOrFail({ session: { id: session.id } }),
    ).toMatchObject({
      status: AttendanceStatus.ABSENT,
    });
  });

  it("records daily principal reviews against the exact attendance revision", async () => {
    const marked = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "present" }],
    });
    const reviewer = {
      ...actor,
      capabilities: [...(actor.capabilities ?? []), "attendance.review"],
    };

    const first = await service.reviewSessionEvery24Hours(
      reviewer,
      marked.sessionId,
    );
    expect(first.sessionId).toBe(marked.sessionId);
    expect(
      await db.query(
        "SELECT sessionId,reviewedRevision FROM attendance_session_reviews",
      ),
    ).toEqual([{ sessionId: marked.sessionId, reviewedRevision: 1 }]);

    const session = await db
      .getRepository(AttendanceSession)
      .findOneByOrFail({ id: marked.sessionId });
    session.revision++;
    await db.getRepository(AttendanceSession).save(session);
    await service.reviewSessionEvery24Hours(reviewer, marked.sessionId);
    expect(
      await db.query(
        "SELECT reviewedRevision FROM attendance_session_reviews ORDER BY reviewedRevision",
      ),
    ).toEqual([{ reviewedRevision: 1 }, { reviewedRevision: 2 }]);
    await expect(
      service.reviewSessionEvery24Hours(
        { ...reviewer, capabilities: [] },
        marked.sessionId,
      ),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });

  it("cancels an unmarked session with an audit trail and prevents absence-first submission", async () => {
    const session = await service.createSession(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: "2026-10-11T05:00:00Z",
    });
    const reviewer = {
      ...actor,
      capabilities: [...(actor.capabilities ?? []), "attendance.review"],
    };
    const cancelled = await service.cancelSession(reviewer, session.id, {
      requestId: randomUUID(),
      expectedRevision: 0,
      reason: "کلاس به علت مراسم برگزار نشد",
    });
    expect(cancelled).toMatchObject({ status: "cancelled", revision: 1 });
    await expect(
      service.submitAbsences(actor, session.id, {
        requestId: randomUUID(),
        expectedRevision: 1,
        absentStudentIds: [],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_SESSION_LOCKED" } },
    });
    expect(await service.sessionHistory(reviewer, session.id)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "attendance.session.cancelled" }),
      ]),
    );
  });

  it("holds a correction as append-only evidence until a reviewer approves the policy-gated request", async () => {
    const marked = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent" }],
    });
    await db.getRepository(AttendancePolicy).save({
      organization: orgA,
      timeZone: "Asia/Tehran",
      dayStartsAt: "04:00",
      allowPartialSubmission: true,
      lateCountsAsPresent: true,
      correctionRequiresReview: true,
    });
    const requested = await service.correctRecord(
      {
        ...actor,
        capabilities: [...(actor.capabilities ?? []), "attendance.correct"],
      },
      marked.records[0].id,
      {
        requestId: randomUUID(),
        expectedRevision: 1,
        status: "late",
        minutesLate: 7,
        reason: "ورود با تأخیر ثبت نشده بود",
      },
    );
    expect(requested).toMatchObject({ pendingReview: true, revision: 1 });
    const beforeReview = await db
      .getRepository(AttendanceRecord)
      .findOneByOrFail({
        id: marked.records[0].id,
      });
    expect(beforeReview.status).toBe(AttendanceStatus.ABSENT);
    const correction = await db
      .getRepository(AttendanceCorrection)
      .findOneByOrFail({
        id: requested.correctionId,
      });
    expect(correction.status).toBe("pending");
    await expect(
      service.listPendingCorrections(
        {
          ...actor,
          capabilities: [...(actor.capabilities ?? []), "attendance.review"],
        },
        orgA.id,
      ),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: correction.id,
          studentId: studentA.id,
          title: expect.any(String),
        }),
      ]),
    );
    const unassigned = await db.getRepository(EducationClass).save({
      organization: orgA,
      code: "PENDING-OTHER",
      name: "کلاس خارج از انتساب",
      schoolYear: "1405",
      gradeId: 1,
      educationTypeId: "school",
      trackId: "general",
    });
    const otherSession = await db.getRepository(AttendanceSession).save({
      organization: orgA,
      contextType: "class",
      contextId: unassigned.id,
      sessionDate: new Date(),
      titleSnapshot: "جلسه خارج از انتساب",
      status: "submitted",
    });
    const otherRecord = await db.getRepository(AttendanceRecord).save({
      session: otherSession,
      student: studentA,
      status: AttendanceStatus.ABSENT,
      revision: 1,
    });
    await db.getRepository(AttendanceCorrection).save({
      session: otherSession,
      record: otherRecord,
      actor: { id: actor.id },
      requestId: randomUUID(),
      reason: "درخواست خارج از محدوده",
      before: { revision: 1, status: "absent" },
      after: { revision: 2, status: "late" },
      status: "pending",
    });
    const teacherQueue = await service.listPendingCorrections(
      {
        ...actor,
        role: "TEACHER",
        roles: ["TEACHER"],
        capabilities: ["attendance.review"],
      },
      orgA.id,
    );
    expect(teacherQueue.map((row) => row.contextId)).toEqual([
      assignedClass.id,
    ]);
    const reviewed = await service.reviewCorrection(
      {
        ...actor,
        capabilities: [...(actor.capabilities ?? []), "attendance.review"],
      },
      correction.id,
      {
        requestId: randomUUID(),
        decision: "approved",
        note: "مدرک ورود بررسی شد",
      },
    );
    expect(reviewed).toMatchObject({ status: "approved", revision: 2 });
    const afterReview = await db
      .getRepository(AttendanceRecord)
      .findOneByOrFail({
        id: marked.records[0].id,
      });
    expect(afterReview).toMatchObject({
      status: AttendanceStatus.LATE,
      minutesLate: 7,
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

  it("rejects a stale correction of a manually created session", async () => {
    const first = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "present" }],
    });
    const session = await db
      .getRepository(AttendanceSession)
      .findOneByOrFail({ id: first.sessionId });
    await service.bulkMark(actor, {
      organizationId: orgA.id,
      sessionId: session.id,
      expectedRevision: session.revision,
      entries: [{ studentId: studentA.id, status: "late" }],
    });
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        sessionId: session.id,
        expectedRevision: session.revision,
        entries: [{ studentId: studentA.id, status: "absent" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_SESSION_STALE" } },
    });
    expect(
      (
        await db
          .getRepository(AttendanceRecord)
          .findOneByOrFail({ student: { id: studentA.id } })
      ).status,
    ).toBe("late");
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

  it("allows attendance changes only while a scheduled session is active", async () => {
    const created = await service.createSession(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      sessionDate: new Date().toISOString(),
    });
    await db.getRepository(AttendanceSession).update(created.id, {
      scheduledStartAt: new Date(Date.now() - 60_000),
      scheduledEndAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        sessionId: created.id,
        entries: [{ studentId: studentA.id, status: "present" }],
      }),
    ).resolves.toMatchObject({ sessionId: created.id, count: 1 });

    await db.getRepository(AttendanceSession).update(created.id, {
      scheduledEndAt: new Date(Date.now() - 1),
    });
    await expect(
      service.bulkMark(actor, {
        organizationId: orgA.id,
        sessionId: created.id,
        entries: [{ studentId: studentA.id, status: "late" }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "ATTENDANCE_SESSION_NOT_ACTIVE" } },
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
    await expect(service.listAbsenceReviews(actor)).resolves.toEqual([]);
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

  it("links principal and supervisor absence-review notifications to the targeted review", async () => {
    const users = db.getRepository(User);
    const principal = await users.findOneByOrFail({
      username: "attendance-test-staff",
    });
    const supervisor = await users.save({
      username: "attendance-notification-supervisor",
      passwordHash: "not-a-login-hash",
      role: UserRole.TEACHER,
    });
    const principalMembership = await db
      .getRepository(OrganizationMembership)
      .findOneByOrFail({
        organization: { id: orgA.id },
        user: { id: principal.id },
      });
    const supervisorMembership = await db
      .getRepository(OrganizationMembership)
      .save({ organization: orgA, user: supervisor });
    const [principalRole, supervisorRole] = await db.getRepository(Role).save([
      { code: "PRINCIPAL", name: "Principal", organizationScoped: true },
      {
        code: "SCHOOL_SUPERVISOR",
        name: "Supervisor",
        organizationScoped: true,
      },
    ]);
    await db.getRepository(UserRoleAssignment).save([
      { user: principal, membership: principalMembership, role: principalRole },
      {
        user: supervisor,
        membership: supervisorMembership,
        role: supervisorRole,
      },
    ]);

    const mark = await service.bulkMark(actor, {
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      entries: [{ studentId: studentA.id, status: "absent" }],
    });
    const notifications = await db.getRepository(Notification).find({
      where: { category: "attendance_review" },
      relations: { user: true },
    });
    const expectedUrl = `/admin/attendance?section=sessions&reviewRecordId=${mark.records[0].id}`;

    expect(notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user: expect.objectContaining({ id: principal.id }),
          url: expectedUrl,
        }),
        expect.objectContaining({
          user: expect.objectContaining({ id: supervisor.id }),
          url: expectedUrl,
        }),
      ]),
    );
  });

  it("scopes attendance-point request idempotency to its actor and organization", async () => {
    const requestId = randomUUID();
    const first = await service.awardPoints(actor, {
      requestId,
      organizationId: orgA.id,
      contextType: "class",
      contextId: assignedClass.id,
      studentId: studentA.id,
      points: 1,
      reason: "رفتار سازنده",
    });
    expect(
      await service.awardPoints(actor, {
        requestId,
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        studentId: studentA.id,
        points: 1,
        reason: "رفتار سازنده",
      }),
    ).toEqual(first);

    const secondUser = await db.getRepository(User).save({
      username: "attendance-second-points-actor",
      passwordHash: "not-a-login-hash",
      role: UserRole.TEACHER,
    });
    await db
      .getRepository(OrganizationMembership)
      .save({ organization: orgA, user: secondUser });
    const second = await service.awardPoints(
      {
        ...actor,
        id: secondUser.id,
        username: secondUser.username,
        sessionId: "second-points-session",
      },
      {
        requestId,
        organizationId: orgA.id,
        contextType: "class",
        contextId: assignedClass.id,
        studentId: studentA.id,
        points: -1,
        reason: "تاخیر تکراری",
      },
    );

    expect(second.id).not.toBe(first.id);
    expect(await db.getRepository(StudentRewardLedger).count()).toBe(2);
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
