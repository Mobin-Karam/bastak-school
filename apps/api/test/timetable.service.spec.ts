import { AcademicService } from "../src/modules/school-education/academic.service";
import "reflect-metadata";
import { migratedDatabase } from "./helpers/migrated-database";
import { ClassesService } from "../src/modules/classes/classes.service";
import { EducationCatalogService } from "../src/modules/education-catalog";
import { DataSource } from "typeorm";
import * as entities from "../src/database/entities";
import {
  Organization,
  OrganizationType,
} from "../src/database/entities/organization.entity";
import { User, UserRole } from "../src/database/entities/user.entity";
import { SchoolAccessService } from "../src/modules/school-access";
import { TimetableService } from "../src/modules/schedule/timetable.service";
import { AttendanceService } from "../src/modules/attendance";
import { AuthorizationService } from "../src/modules/authorization";
import { RealtimeService } from "../src/modules/realtime";
import { NotificationsService } from "../src/modules/notifications";
import type { AuthenticatedUser } from "../src/modules/auth";
import type { TimetableLessonDto } from "../src/modules/schedule/timetable.dto";
const {
  EducationClass,
  EducationBook,
  EducationClassBook,
  EducationClassEnrollment,
  UserRoleAssignment,
  OrganizationMembership,
  Role,
  Student,
  AttendanceSession,
  AttendanceRecord,
  StudyGroup,
  StudyGroupMembership,
  DormRoom,
  DormRoomAssignment,
  TimetableVersion,
  TimetableOccurrence,
  SchoolScheduleEntry,
} = entities;
describe("versioned timetable integration (migration-built SQLite)", () => {
  let db: DataSource,
    service: TimetableService,
    staff: AuthenticatedUser,
    studentActor: AuthenticatedUser,
    teacherActor: AuthenticatedUser,
    org: Organization,
    draftId: string,
    lesson: TimetableLessonDto,
    teacher: User;
  const notifications = { createForUsers: jest.fn().mockResolvedValue([]) };
  beforeEach(async () => {
    notifications.createForUsers.mockClear();
    db = await migratedDatabase();
    const m = db.manager;
    org = await m.save(
      Organization,
      m.create(Organization, { name: "School", type: OrganizationType.SCHOOL }),
    );
    const principal = await m.save(
      User,
      m.create(User, {
        username: "principal",
        passwordHash: "fixture",
        role: UserRole.ORGANIZATION_ADMIN,
      }),
    );
    teacher = await m.save(
      User,
      m.create(User, {
        username: "teacher",
        passwordHash: "fixture",
        role: UserRole.TEACHER,
      }),
    );
    const studentUser = await m.save(
      User,
      m.create(User, {
        username: "student",
        passwordHash: "fixture",
        role: UserRole.STUDENT,
      }),
    );
    const role = await m.findOneByOrFail(Role, { code: "TEACHER" });
    for (const user of [principal, teacher, studentUser]) {
      const membership = await m.save(
        OrganizationMembership,
        m.create(OrganizationMembership, { user, organization: org }),
      );
      if (user.id === teacher.id)
        await m.save(
          UserRoleAssignment,
          m.create(UserRoleAssignment, { user, role, membership }),
        );
    }
    const classroom = await m.save(
      EducationClass,
      m.create(EducationClass, {
        organization: org,
        code: "A",
        name: "اول",
        schoolYear: "1405",
        gradeId: 1,
        educationTypeId: "school",
        trackId: "general",
      }),
    );
    const student = await m.save(
      Student,
      m.create(Student, {
        user: studentUser,
        organization: org,
        name: "Student",
      }),
    );
    await m.save(
      EducationClassEnrollment,
      m.create(EducationClassEnrollment, { classroom, student }),
    );
    const book = await m.save(
      EducationBook,
      m.create(EducationBook, {
        id: "nahw",
        country: "IR",
        schoolYear: "1405",
        grade: 1,
        level: "school",
        branch: "general",
        track: "general",
        category: "درس",
        titleFa: "نحو",
        titleEn: "Nahw",
        appliesTo: [],
      }),
    );
    const classBook = await m.save(
      EducationClassBook,
      m.create(EducationClassBook, { classroom, book, teacher }),
    );
    staff = {
      id: principal.id,
      username: principal.username,
      role: "PRINCIPAL",
      roles: ["PRINCIPAL"],
      capabilities: [
        "schedule.read",
        "schedule.read.all",
        "schedule.create",
        "schedule.update",
        "schedule.delete",
        "schedule.import",
        "schedule.publish",
        "attendance.class.manage",
        "attendance.class.read",
        "attendance.read",
        "attendance.manage",
      ],
      organizationIds: [org.id],
      activeOrganizationId: org.id,
      sessionId: "fixture",
    };
    studentActor = {
      ...staff,
      id: studentUser.id,
      username: "student",
      role: "STUDENT",
      roles: ["STUDENT"],
      capabilities: ["schedule.read"],
    };
    teacherActor = {
      ...studentActor,
      id: teacher.id,
      username: "teacher",
      role: "TEACHER",
      roles: ["TEACHER"],
    };
    const access = new SchoolAccessService(
      db.getRepository(Organization),
      db.getRepository(OrganizationMembership),
    );
    const attendance = new AttendanceService(
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
      new RealtimeService(),
    );
    service = new TimetableService(
      db,
      access,
      attendance,
      notifications as unknown as NotificationsService,
    );
    const year = (await service.config(staff, org.id, {
      kind: "year",
      name: "1405",
      startsOn: "2026-01-01",
      endsOn: "2026-12-31",
      timeZone: "Asia/Tehran",
      active: true,
    })) as entities.TimetableAcademicYear;
    const term = (await service.config(staff, org.id, {
      kind: "term",
      parentId: year.id,
      name: "اول",
      startsOn: "2026-01-01",
      endsOn: "2026-12-31",
    })) as entities.TimetableTerm;
    const bell = (await service.config(staff, org.id, {
      kind: "bell",
      name: "مدرسه",
    })) as entities.TimetableBellSchedule;
    const session = (await service.config(staff, org.id, {
      kind: "session",
      parentId: bell.id,
      name: "صبح",
      startTime: "07:00",
      endTime: "12:00",
    })) as entities.TimetableDailySession;
    const period = (await service.config(staff, org.id, {
      kind: "period",
      parentId: session.id,
      name: "اول",
      number: 1,
      startTime: "08:00",
      endTime: "09:00",
    })) as entities.TimetablePeriod;
    const version = await service.createVersion(staff, org.id, {
      termId: term.id,
      name: "پیش‌نویس",
      effectiveOn: "2026-01-01",
      reason: "نسخه اول",
    });
    draftId = version.id;
    lesson = {
      classroomId: classroom.id,
      classBookId: classBook.id,
      teacherId: teacher.id,
      periodId: period.id,
      weekday: 0,
      startTime: "08:00",
      endTime: "09:00",
      startsOn: "2026-01-01",
      endsOn: "2026-12-31",
    };
  });
  afterEach(() => db.destroy());
  it("previews and commits bounded bulk lessons atomically", async () => {
    const items = [{ lesson }, { lesson: { ...lesson, weekday: 1 } }];
    expect(
      await service.bulk(staff, draftId, { expectedRevision: 0, items }, true),
    ).toMatchObject({ valid: true, revision: 0 });
    expect(await db.manager.count(SchoolScheduleEntry)).toBe(0);
    await expect(
      service.bulk(staff, draftId, {
        expectedRevision: 0,
        items: [{ lesson }, { lesson }],
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_CONFLICT" } },
    });
    expect(await db.manager.count(SchoolScheduleEntry)).toBe(0);
    expect(
      await service.bulk(staff, draftId, { expectedRevision: 0, items }),
    ).toMatchObject({ revision: 1 });
    expect(await db.manager.count(SchoolScheduleEntry)).toBe(2);
    await expect(
      service.bulk(studentActor, draftId, { expectedRevision: 1, items }),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });
  it("archives drafts without exposing them as approved versions", async () => {
    const actor = {
      ...staff,
      capabilities: [...staff.capabilities!, "schedule.archive"],
    };
    expect(
      (
        await service.archive(actor, draftId, {
          expectedRevision: 0,
          reason: "unused draft",
        })
      ).state,
    ).toBe("ARCHIVED");
    expect(
      (await service.workspace(studentActor, org.id, undefined, "2026-01-04"))
        .versions,
    ).toEqual([]);
    await expect(
      service.workspace(studentActor, org.id, draftId),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_NOT_FOUND" } },
    });
    await expect(
      service.publish(staff, draftId, {
        expectedRevision: 1,
        reason: "publish",
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_IMMUTABLE" } },
    });
  });
  it("filters and paginates daily student and teacher occurrences", async () => {
    await service.bulk(staff, draftId, {
      expectedRevision: 0,
      items: [{ lesson }, { lesson: { ...lesson, weekday: 1 } }],
    });
    await service.publish(staff, draftId, {
      expectedRevision: 1,
      reason: "publish",
    });
    const rows = await service.occurrences(studentActor, org.id, {
      startsOn: "2026-01-04",
      view: "DAILY",
      offset: 0,
      limit: 1,
    });
    expect(rows.total).toBe(1);
    expect(rows.items[0].teacherId).toBe(teacher.id);
    const versions = await service.versions(studentActor, org.id, {
      offset: 0,
      limit: 1,
    });
    expect(versions.total).toBe(1);
    const version = await db.manager.findOneByOrFail(TimetableVersion, {
      id: draftId,
    });
    const term = await db.manager.findOneByOrFail(entities.TimetableTerm, {
      id: version.termId,
    });
    await db.manager.update(
      entities.TimetableAcademicYear,
      { id: term.yearId },
      { active: false },
    );
    expect(
      (
        await service.occurrences(studentActor, org.id, {
          academicYearId: term.yearId,
          startsOn: "2026-01-04",
          view: "DAILY",
          offset: 0,
          limit: 50,
        })
      ).total,
    ).toBe(1);
    expect(
      (
        await service.occurrences(studentActor, org.id, {
          startsOn: "2026-01-04",
          view: "DAILY",
          offset: 0,
          limit: 50,
        })
      ).total,
    ).toBe(0);

    await expect(
      service.occurrences(studentActor, org.id, {
        startsOn: "2026-01-01",
        endsOn: "2026-02-15",
        offset: 0,
        limit: 1,
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_QUERY_LIMIT" } },
    });
  });
  it("keeps the executing archived version editable before a future successor", async () => {
    const written = (await service.writeLesson(staff, draftId, {
      expectedRevision: 0,
      lesson,
    })) as { id: string };
    await service.publish(staff, draftId, {
      expectedRevision: 1,
      reason: "publish",
    });
    const old = await db.manager.findOneByOrFail(TimetableVersion, {
      id: draftId,
    });
    const next = await service.createVersion(staff, org.id, {
      termId: old.termId,
      name: "future",
      effectiveOn: "2026-02-01",
      copyVersionId: draftId,
      reason: "future schedule",
    });
    await service.publish(staff, next.id, {
      expectedRevision: 0,
      reason: "publish future",
    });
    expect(
      (
        await service.override(staff, draftId, {
          expectedRevision: 2,
          lessonId: written.id,
          date: "2026-01-04",
          cancelled: true,
          reason: "one day",
        })
      ).cancelled,
    ).toBe(true);
    await expect(
      service.override(staff, draftId, {
        expectedRevision: 3,
        lessonId: written.id,
        date: "2026-02-01",
        cancelled: true,
        reason: "wrong version",
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_SUPERSEDED" } },
    });
  });
  it("rejects teacher collisions across concurrently executing terms", async () => {
    await service.writeLesson(staff, draftId, { expectedRevision: 0, lesson });
    await service.publish(staff, draftId, {
      expectedRevision: 1,
      reason: "publish",
    });
    const first = await db.manager.findOneByOrFail(TimetableVersion, {
      id: draftId,
    });
    const term = await db.manager.findOneByOrFail(entities.TimetableTerm, {
      id: first.termId,
    });
    const other = (await service.config(staff, org.id, {
      kind: "term",
      parentId: term.yearId,
      name: "parallel term",
      startsOn: term.startsOn,
      endsOn: term.endsOn,
    })) as entities.TimetableTerm;
    const version = await service.createVersion(staff, org.id, {
      termId: other.id,
      name: "parallel",
      effectiveOn: term.startsOn,
      reason: "parallel schedule",
    });
    await expect(
      service.writeLesson(staff, version.id, { expectedRevision: 0, lesson }),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_CONFLICT" } },
    });
  });
  it("reschedules and restores open attendance without deleting observations", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
    jest.setSystemTime(new Date("2026-10-11T05:00:00Z"));
    try {
      const written = (await service.writeLesson(staff, draftId, {
        expectedRevision: 0,
        lesson,
      })) as { id: string };
      await service.publish(staff, draftId, {
        expectedRevision: 1,
        reason: "publish",
      });
      const linked = await service.openAttendance(
        staff,
        written.id,
        "2026-10-11",
      );
      await service.override(staff, draftId, {
        expectedRevision: 2,
        lessonId: written.id,
        date: "2026-10-11",
        cancelled: true,
        reason: "cancel",
      });
      await service.override(staff, draftId, {
        expectedRevision: 3,
        lessonId: written.id,
        date: "2026-10-11",
        cancelled: false,
        startTime: "08:10",
        endTime: "08:50",
        reason: "restore",
      });
      const row = await db.manager.findOneByOrFail(AttendanceSession, {
        id: linked.sessionId,
      });
      expect(row.status).toBe("open");
      expect(row.scheduledStartAt!.toISOString()).toBe(
        "2026-10-11T04:40:00.000Z",
      );
      const enrollment = await db.manager.findOne(EducationClassEnrollment, {
        where: { classroom: { id: lesson.classroomId } },
        relations: { student: true },
      });
      await db.manager.save(
        AttendanceRecord,
        db.manager.create(AttendanceRecord, {
          session: row,
          student: enrollment!.student,
          status: entities.AttendanceStatus.PRESENT,
        }),
      );
      await expect(
        service.override(staff, draftId, {
          expectedRevision: 4,
          lessonId: written.id,
          date: "2026-10-11",
          cancelled: false,
          startTime: "08:20",
          endTime: "08:50",
          reason: "recorded",
        }),
      ).rejects.toMatchObject({
        response: { error: { code: "ATTENDANCE_CORRECTION_REQUIRED" } },
      });
      expect(
        (await db.manager.findOneByOrFail(TimetableVersion, { id: draftId }))
          .revision,
      ).toBe(4);
    } finally {
      jest.useRealTimers();
    }
  });

  it("creates scoped academic assignments and keeps subject/book identities distinct", async () => {
    const access = new SchoolAccessService(
      db.getRepository(Organization),
      db.getRepository(OrganizationMembership),
    );
    const academic = new AcademicService(db, access);
    const actor = {
      ...staff,
      capabilities: [
        ...staff.capabilities!,
        "classes.manage",
        "classes.read",
        "education.catalog.manage",
        "education.catalog.read",
      ],
    };
    const version = await db.manager.findOneByOrFail(TimetableVersion, {
      id: draftId,
    });
    const term = await db.manager.findOneByOrFail(entities.TimetableTerm, {
      id: version.termId,
    });
    await db.manager.update(
      EducationClass,
      { id: lesson.classroomId },
      { academicYearId: term.yearId },
    );
    const subject = await academic.createSubject(actor, org.id, {
      code: "nahw",
      name: "نحو",
    });
    await expect(
      academic.createSubject(actor, org.id, { code: "NAHW", name: "نحو" }),
    ).rejects.toMatchObject({
      response: { error: { code: "SUBJECT_CODE_EXISTS" } },
    });
    expect(
      (
        await academic.subjects(actor, org.id, { offset: 0, limit: 50 })
      ).items.map((s) => s.id),
    ).toEqual([subject.id]);
    const dto = {
      academicYearId: term.yearId,
      termId: term.id,
      classroomId: lesson.classroomId,
      subjectId: subject.id,
      teacherId: teacher.id,
      startsOn: lesson.startsOn,
      endsOn: lesson.endsOn,
    };
    const assigned = await academic.createAssignment(actor, org.id, dto);
    expect(assigned.subjectId).toBe(subject.id);
    await expect(
      academic.createAssignment(actor, org.id, dto),
    ).rejects.toMatchObject({
      response: { error: { code: "ACADEMIC_ASSIGNMENT_OVERLAP" } },
    });
    await expect(
      academic.createAssignment(studentActor, org.id, dto),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
    await expect(
      academic.createAssignment(
        { ...actor, activeOrganizationId: "foreign" },
        org.id,
        dto,
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "ORGANIZATION_FORBIDDEN" } },
    });
    expect(
      (
        await academic.reference(actor, org.id, {
          subjectId: subject.id,
          bookId: "nahw",
        })
      ).subjectId,
    ).toBe(subject.id);
    expect(await db.manager.count(entities.TeachingAssignment)).toBe(1);
    const foreign = await db.manager.save(
      Organization,
      db.manager.create(Organization, {
        name: "foreign",
        type: OrganizationType.SCHOOL,
      }),
    );
    await expect(
      db.manager.save(
        entities.TeachingAssignment,
        db.manager.create(entities.TeachingAssignment, {
          ...dto,
          organizationId: foreign.id,
          createdById: actor.id,
        }),
      ),
    ).rejects.toThrow();
  });

  it("rejects stale revisions and prevents overlapping lessons", async () => {
    await service.writeLesson(staff, draftId, { expectedRevision: 0, lesson });
    await expect(
      service.writeLesson(staff, draftId, { expectedRevision: 0, lesson }),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_STALE" } },
    });
    await expect(
      service.writeLesson(staff, draftId, {
        expectedRevision: 1,
        lesson: { ...lesson, startTime: "08:30", endTime: "09:30" },
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_CONFLICT" } },
    });
  });
  it("publishes immutable versions and scopes student/teacher feeds", async () => {
    await service.writeLesson(staff, draftId, { expectedRevision: 0, lesson });
    const published = await service.publish(staff, draftId, {
      expectedRevision: 1,
      reason: "تأیید مدیر",
    });
    expect(published.state).toBe("PUBLISHED");
    expect(notifications.createForUsers).toHaveBeenCalled();
    const student = await service.workspace(
      studentActor,
      org.id,
      undefined,
      "2026-01-04",
    );
    expect(student.lessons).toHaveLength(1);
    expect(student.teachers).toEqual([]);
    expect(student.changes).toEqual([]);
    expect(
      (await service.workspace(teacherActor, org.id, undefined, "2026-01-04"))
        .lessons,
    ).toHaveLength(1);
    await expect(
      service.writeLesson(staff, draftId, { expectedRevision: 2, lesson }),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_IMMUTABLE" } },
    });
  });
  it("uses effective work roles for a student who also has a teacher assignment", async () => {
    const membership = await db.manager.findOneOrFail(OrganizationMembership, {
      where: { user: { id: studentActor.id }, organization: { id: org.id } },
    });
    const role = await db.manager.findOneByOrFail(Role, { code: "TEACHER" });
    await db.manager.save(
      UserRoleAssignment,
      db.manager.create(UserRoleAssignment, {
        user: { id: studentActor.id },
        membership,
        role,
      }),
    );
    await service.writeLesson(staff, draftId, { expectedRevision: 0, lesson });
    await service.publish(staff, draftId, {
      expectedRevision: 1,
      reason: "تأیید مدیر",
    });
    expect(
      (await service.workspace(studentActor, org.id, undefined, "2026-01-04"))
        .lessons,
    ).toHaveLength(1);
    const teaching = { ...studentActor, role: "TEACHER", roles: ["TEACHER"] };
    expect(
      (await service.workspace(teaching, org.id, undefined, "2026-01-04"))
        .lessons,
    ).toHaveLength(0);
    const combined = { ...studentActor, roles: ["STUDENT", "TEACHER"] };
    expect(
      (await service.workspace(combined, org.id, undefined, "2026-01-04"))
        .lessons,
    ).toHaveLength(1);
  });
  it("hides drafts and enforces school/capability boundaries", async () => {
    await service.writeLesson(staff, draftId, { expectedRevision: 0, lesson });
    await expect(
      service.workspace(studentActor, org.id, draftId),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_NOT_FOUND" } },
    });
    await expect(
      service.config(studentActor, org.id, { kind: "location", name: "Room" }),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
    await expect(
      service.workspace({ ...staff, activeOrganizationId: "foreign" }, org.id),
    ).rejects.toMatchObject({
      response: { error: { code: "ORGANIZATION_FORBIDDEN" } },
    });
  });
  it("imports atomically and rejects conflicts before any row is persisted", async () => {
    const body = {
      expectedRevision: 0,
      filename: "fixture.xlsx",
      sheetName: "اصلی",
      rows: [
        { source: "اصلی!C4", lesson },
        { source: "اصلی!E4", lesson },
      ],
    };
    expect((await service.previewImport(staff, draftId, body)).valid).toBe(
      false,
    );
    await expect(
      service.commitImport(staff, draftId, body),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_IMPORT_INVALID" } },
    });
    expect(await db.manager.count(SchoolScheduleEntry)).toBe(0);
    body.rows.pop();
    expect((await service.commitImport(staff, draftId, body)).imported).toBe(1);
  });
  it("allows multiple import batches while enforcing complete allocations at publication", async () => {
    await service.config(staff, org.id, {
      kind: "allocation",
      parentId: draftId,
      expectedRevision: 0,
      classroomId: lesson.classroomId,
      classBookId: lesson.classBookId,
      number: 2,
    });
    const first = {
      expectedRevision: 1,
      filename: "مبین.xlsx",
      sheetName: "اصلی",
      rows: [{ source: "اصلی!C4", lesson }],
    };
    expect((await service.previewImport(staff, draftId, first)).valid).toBe(
      true,
    );
    expect((await service.commitImport(staff, draftId, first)).revision).toBe(
      2,
    );
    await expect(
      service.publish(staff, draftId, {
        expectedRevision: 2,
        reason: "تأیید مدیر",
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_CONFLICT" } },
    });
    const second = {
      ...first,
      expectedRevision: 2,
      rows: [{ source: "اصلی!C14", lesson: { ...lesson, weekday: 1 } }],
    };
    await service.commitImport(staff, draftId, second);
    expect(
      (
        await service.publish(staff, draftId, {
          expectedRevision: 3,
          reason: "تأیید مدیر",
        })
      ).state,
    ).toBe("PUBLISHED");
    const imported = await db.manager.find(SchoolScheduleEntry, {
      where: { versionId: draftId },
      relations: { classroom: true, classBook: { book: true }, teacher: true },
    });
    expect(imported).toHaveLength(2);
    expect(
      imported.every(
        (row) =>
          row.classroom!.id === lesson.classroomId &&
          row.classBook!.id === lesson.classBookId &&
          row.teacher!.id === teacher.id &&
          row.classBook!.book.titleFa === "نحو",
      ),
    ).toBe(true);
    expect(await db.manager.count(entities.TimetableImport)).toBe(2);
  });
  it("preserves enrollment changes and recorded attendance independently of the current roster", async () => {
    const actor = {
      ...staff,
      capabilities: [
        ...staff.capabilities!,
        "classes.read",
        "classes.roster.manage",
      ],
    };
    const authorization = new AuthorizationService(
      db.getRepository(UserRoleAssignment),
      db.getRepository(OrganizationMembership),
      db.getRepository(entities.UserRelationship),
      db.getRepository(Student),
    );
    const classes = new ClassesService(
      db.getRepository(EducationClass),
      db.getRepository(EducationClassBook),
      db.getRepository(EducationClassEnrollment),
      db.getRepository(EducationBook),
      db.getRepository(Organization),
      db.getRepository(OrganizationMembership),
      db.getRepository(Student),
      db.getRepository(User),
      db.getRepository(UserRoleAssignment),
      authorization,
      {} as EducationCatalogService,
    );
    const before = await db.manager.findOne(EducationClassEnrollment, {
      where: { classroom: { id: lesson.classroomId } },
      relations: { student: true },
    });
    const historical = await db.manager.save(
      AttendanceSession,
      db.manager.create(AttendanceSession, {
        organization: org,
        contextType: "class",
        contextId: lesson.classroomId,
        sessionDate: new Date("2026-01-04T04:30:00Z"),
      }),
    );
    await db.manager.save(
      AttendanceRecord,
      db.manager.create(AttendanceRecord, {
        session: historical,
        student: before!.student,
        status: entities.AttendanceStatus.PRESENT,
      }),
    );
    await classes.setEnrollments(actor, lesson.classroomId, { studentIds: [] });
    expect(await db.manager.count(EducationClassEnrollment)).toBe(0);
    expect(await db.manager.count(AttendanceRecord)).toBe(1);
    const history = await classes.enrollmentHistory(actor, lesson.classroomId);
    expect(history.total).toBe(1);
    expect(history.items[0].beforeStudentIds).toEqual([before!.student.id]);
    expect(history.items[0].afterStudentIds).toEqual([]);
    await classes.setEnrollments(actor, lesson.classroomId, { studentIds: [] });
    expect(
      (await classes.enrollmentHistory(actor, lesson.classroomId)).total,
    ).toBe(1);
    await expect(
      classes.enrollmentHistory(
        { ...actor, organizationIds: [], activeOrganizationId: undefined },
        lesson.classroomId,
      ),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });

  it("prepares class books without changing existing timetable references", async () => {
    const actor = {
      ...staff,
      capabilities: [...staff.capabilities!, "education.catalog.manage"],
    };
    const catalog = {
      listBooks: async () => db.manager.find(EducationBook),
    } as unknown as EducationCatalogService;
    const authorization = {
      requireCapability: jest.fn(),
    } as unknown as AuthorizationService;
    const classes = new ClassesService(
      db.getRepository(EducationClass),
      db.getRepository(EducationClassBook),
      db.getRepository(EducationClassEnrollment),
      db.getRepository(EducationBook),
      db.getRepository(Organization),
      db.getRepository(OrganizationMembership),
      db.getRepository(Student),
      db.getRepository(User),
      db.getRepository(UserRoleAssignment),
      authorization,
      catalog,
    );
    await service.writeLesson(staff, draftId, { expectedRevision: 0, lesson });
    await db.manager.save(
      EducationBook,
      db.manager.create(EducationBook, {
        id: "fiqh",
        country: "IR",
        schoolYear: "1405",
        grade: 1,
        level: "school",
        branch: "general",
        track: "general",
        category: "درس",
        titleFa: "فقه",
        titleEn: "Fiqh",
        appliesTo: [],
      }),
    );
    const result = await classes.addBook(actor, lesson.classroomId, {
      bookId: "fiqh",
      teacherId: teacher.id,
    });
    expect(result.books).toHaveLength(2);
    expect(result.books.some((x) => x.id === lesson.classBookId)).toBe(true);
    const updated = await classes.setBooks(actor, lesson.classroomId, {
      books: result.books.map((row) => ({
        bookId: row.bookId,
        teacherId: teacher.id,
      })),
    });
    expect(updated.books.map((row) => row.id).sort()).toEqual(
      result.books.map((row) => row.id).sort(),
    );
    await expect(
      classes.setBooks(actor, lesson.classroomId, { books: [] }),
    ).rejects.toMatchObject({
      response: { error: { code: "CLASS_BOOK_TIMETABLE_REFERENCED" } },
    });
    await expect(
      classes.remove(actor, lesson.classroomId),
    ).rejects.toMatchObject({
      response: { error: { code: "CLASS_TIMETABLE_REFERENCED" } },
    });

    expect(
      (
        await db.manager.findOneOrFail(SchoolScheduleEntry, {
          where: { versionId: draftId },
          relations: { classBook: true },
        })
      ).classBook!.id,
    ).toBe(lesson.classBookId);
    await expect(
      classes.addBook(actor, lesson.classroomId, {
        bookId: "fiqh",
        teacherId: teacher.id,
      }),
    ).rejects.toMatchObject({
      response: { error: { code: "CLASS_BOOK_EXISTS" } },
    });
    await expect(
      classes.addBook(
        { ...actor, activeOrganizationId: "foreign" },
        lesson.classroomId,
        { bookId: "fiqh", teacherId: teacher.id },
      ),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
  });
  it("reports incorrect class-book connections at their source row before import", async () => {
    const other = await db.manager.save(
      EducationClass,
      db.manager.create(EducationClass, {
        organization: org,
        code: "B",
        name: "دوم",
        schoolYear: "1405",
        gradeId: 1,
        educationTypeId: "school",
        trackId: "general",
      }),
    );
    const body = {
      expectedRevision: 0,
      filename: "مبین.xlsx",
      sheetName: "اصلی",
      rows: [
        { source: "اصلی!C4", lesson: { ...lesson, classroomId: other.id } },
      ],
    };
    const result = await service.previewImport(staff, draftId, body);
    expect(result.valid).toBe(false);
    expect(result.rows[0].source).toBe("اصلی!C4");
    expect(result.rows[0].errors[0]).not.toBe("ApiException");
    await expect(
      service.commitImport(staff, draftId, body),
    ).rejects.toMatchObject({
      response: { error: { code: "TIMETABLE_IMPORT_INVALID" } },
    });
    expect(await db.manager.count(SchoolScheduleEntry)).toBe(0);
  });
  it("copies published lessons without rewriting the source", async () => {
    await service.writeLesson(staff, draftId, { expectedRevision: 0, lesson });
    await service.publish(staff, draftId, {
      expectedRevision: 1,
      reason: "تأیید مدیر",
    });
    const source = await db.manager.findOneByOrFail(TimetableVersion, {
      id: draftId,
    });
    const copy = await service.createVersion(staff, org.id, {
      termId: source.termId,
      name: "تغییر دائمی",
      effectiveOn: "2026-02-01",
      reason: "نسخه جدید",
      copyVersionId: draftId,
    });
    const rows = await db.manager.find(SchoolScheduleEntry);
    expect(rows).toHaveLength(2);
    expect(rows.find((x) => x.versionId === draftId)!.startsOn).toBe(
      "2026-01-01",
    );
    expect(rows.find((x) => x.versionId === copy.id)!.startsOn).toBe(
      "2026-02-01",
    );
  });
  it("links attendance to the exact lesson/date and preserves it on cancellation", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
    jest.setSystemTime(new Date("2026-10-11T05:00:00Z"));
    try {
      const written = (await service.writeLesson(staff, draftId, {
        expectedRevision: 0,
        lesson,
      })) as { id: string };
      await service.publish(staff, draftId, {
        expectedRevision: 1,
        reason: "تأیید مدیر",
      });
      const first = await service.openAttendance(
        staff,
        written.id,
        "2026-10-11",
      );
      const again = await service.openAttendance(
        staff,
        written.id,
        "2026-10-11",
      );
      expect(again.sessionId).toBe(first.sessionId);
      expect(await db.manager.count(TimetableOccurrence)).toBe(1);
      await service.override(staff, draftId, {
        expectedRevision: 2,
        lessonId: written.id,
        date: "2026-10-11",
        cancelled: true,
        reason: "تعطیلی اضطراری",
      });
      expect(
        (await service.openAttendance(staff, written.id, "2026-10-11"))
          .sessionId,
      ).toBe(first.sessionId);
      expect(
        (
          await db.manager.findOneByOrFail(AttendanceSession, {
            id: first.sessionId,
          })
        ).status,
      ).toBe("cancelled");
    } finally {
      jest.useRealTimers();
    }
  });
});
