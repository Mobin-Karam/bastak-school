import {
  TeachingAssignment,
  SubjectBookReference,
} from "../../database/entities/academic-structure.entity";
import { Student } from "../../database/entities/student.entity";
import {
  UserRelationship,
  RelationshipType,
  RelationshipStatus,
} from "../../database/entities/user-relationship.entity";
import { User, UserStatus } from "../../database/entities/user.entity";
import {
  OrganizationMembership,
  MembershipStatus,
} from "../../database/entities/organization-membership.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In, Not, IsNull } from "typeorm";
import { createHash, randomUUID } from "node:crypto";
import type {
  TimetableLesson,
  TimetableWorkspace,
  TimetableAttendanceReport,
  TimetableVersion as VersionContract,
  TimetableOverride as OverrideContract,
} from "@moshaver/api-contract";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  TimetableAcademicYear,
  TimetableTerm,
  TimetableSection,
  TimetableLocation,
  TimetableBellSchedule,
  TimetableDailySession,
  TimetablePeriod,
  TimetableVersion,
  TimetableHoliday,
  TimetableTeacherAvailability,
  TimetableAllocation,
  TimetableOverride,
  TimetableOccurrence,
  TimetableChange,
  TimetableImport,
  TimetableSubstitutionRequest,
} from "../../database/entities/timetable.entity";
import { SchoolScheduleEntry } from "../../database/entities/school-schedule-entry.entity";
import { AttendanceRecord } from "../../database/entities/attendance-record.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassBook } from "../../database/entities/education-class-book.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { AttendanceService, attendanceTransaction } from "../attendance";
import { NotificationsService } from "../notifications";
import {
  TimetableQueryDto,
  TimetablePageDto,
  TimetableBulkDto,
  TimetableConfigDto,
  TimetableLessonDto,
  TimetableLessonWriteDto,
  TimetableVersionDto,
  TimetablePublishDto,
  TimetableOverrideDto,
  TimetableImportDto,
  TimetableSubstitutionRequestDto,
  TimetableSubstitutionDecisionDto,
} from "./timetable.dto";
import {
  canonicalDate,
  addDays,
  weekdayOf,
  minuteOf,
  occurrencesForRange,
  detectTimetableConflicts,
} from "./timetable-domain";

type LessonBatch = {
  classes: Map<string, EducationClass>;
  books: Map<string, EducationClassBook>;
  periods: Map<string, TimetablePeriod>;
  sessions: Map<string, TimetableDailySession>;
  bells: Map<string, TimetableBellSchedule>;
  teachers: Map<string, User>;
  locations: Map<string, TimetableLocation>;
  existing: Map<string, SchoolScheduleEntry>;
  references: SubjectBookReference[];
  assignments: TeachingAssignment[];
};

@Injectable()
export class TimetableService {
  constructor(
    private readonly database: DataSource,
    private readonly access: SchoolAccessService,
    private readonly attendance: AttendanceService,
    private readonly notifications: NotificationsService,
  ) {}
  async requestSubstitution(
    user: AuthenticatedUser,
    versionId: string,
    dto: TimetableSubstitutionRequestDto,
  ) {
    const { version, term, year } = await this.version(
      user,
      versionId,
      "schedule.read",
      this.database.manager,
    );
    const data = await this.versionData(
      this.database.manager,
      version,
      term,
      year,
    );
    const lesson = data.lessons.find((row) => row.id === dto.lessonId);
    if (
      !lesson ||
      lesson.teacherId !== user.id ||
      weekdayOf(dto.freezeDate) !== lesson.weekday
    )
      this.fail(
        "TIMETABLE_SUBSTITUTION_FORBIDDEN",
        "فقط استاد جلسه اصلی می‌تواند درخواست ثبت کند.",
        403,
      );
    this.times(dto.replacementStartTime, dto.replacementEndTime);
    return this.database.manager
      .getRepository(TimetableSubstitutionRequest)
      .save({
        versionId,
        lessonId: dto.lessonId,
        freezeDate: dto.freezeDate,
        replacementDate: dto.replacementDate,
        replacementStartTime: dto.replacementStartTime,
        replacementEndTime: dto.replacementEndTime,
        title: dto.title,
        message: dto.message?.trim() || "",
        status: "pending",
        requestedById: user.id,
        reviewedById: null,
        reviewedAt: null,
      });
  }
  async reviewSubstitution(
    user: AuthenticatedUser,
    id: string,
    dto: TimetableSubstitutionDecisionDto,
  ) {
    const request = await this.database.manager
      .getRepository(TimetableSubstitutionRequest)
      .findOneBy({ id });
    if (!request || request.status !== "pending")
      this.fail(
        "TIMETABLE_SUBSTITUTION_NOT_FOUND",
        "درخواست در انتظار بررسی پیدا نشد.",
        404,
      );
    const { version, term, year } = await this.version(
      user,
      request.versionId,
      "schedule.publish",
      this.database.manager,
    );
    request.status = dto.decision;
    request.reviewedById = user.id;
    request.reviewedAt = new Date();
    if (dto.decision === "approved") {
      const original = (
        await this.versionData(this.database.manager, version, term, year)
      ).lessons.find((row) => row.id === request.lessonId);
      if (!original)
        this.fail("TIMETABLE_LESSON_NOT_FOUND", "جلسه اصلی پیدا نشد.", 404);
      await this.database.manager
        .getRepository(TimetableOverride)
        .save({
          versionId: version.id,
          lessonId: original.id,
          date: request.freezeDate,
          cancelled: true,
          teacherId: null,
          locationId: null,
          startTime: null,
          endTime: null,
          reason: request.message || request.title,
          changedById: user.id,
          changedByName: this.name(user),
        });
      await this.database.manager
        .getRepository(SchoolScheduleEntry)
        .save({
          organization: { id: year.organizationId } as never,
          classroom: { id: original.classroomId } as never,
          classBook: { id: original.classBookId } as never,
          teacher: { id: original.teacherId } as never,
          title: request.title,
          weekday: weekdayOf(request.replacementDate),
          startTime: request.replacementStartTime,
          endTime: request.replacementEndTime,
          room: "",
          status: "ACTIVE",
          versionId: version.id,
          periodId: original.periodId,
          locationId: original.locationId,
          startsOn: request.replacementDate,
          endsOn: request.replacementDate,
          notes: request.message,
          classroomNameSnapshot: original.classroomName,
          teacherNameSnapshot: original.teacherName,
        });
    }
    return this.database.manager
      .getRepository(TimetableSubstitutionRequest)
      .save(request);
  }
  private fail(
    code: string,
    message: string,
    status = 422,
    details?: unknown,
  ): never {
    throw new ApiException(status, code, message, details);
  }
  private capability(user: AuthenticatedUser, code: string) {
    if (!user.capabilities?.includes(code))
      this.fail("FORBIDDEN", "دسترسی کافی ندارید.", 403);
  }
  private async school(
    user: AuthenticatedUser,
    id: string,
    capability = "schedule.read",
  ) {
    this.capability(user, capability);
    if (user.activeOrganizationId && user.activeOrganizationId !== id)
      this.fail(
        "ORGANIZATION_FORBIDDEN",
        "مدرسه با زمینه کاری فعال یکسان نیست.",
        403,
      );
    await this.access.organizationForUser(user, id);
    return id;
  }
  private name(user: AuthenticatedUser) {
    return user.username || "کاربر";
  }
  private person(user: User) {
    return (
      [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username
    );
  }
  private dates(start: string, end: string) {
    try {
      canonicalDate(start);
      canonicalDate(end);
      if (end < start || Date.parse(end) - Date.parse(start) > 730 * 86400000)
        throw Error();
    } catch {
      this.fail(
        "TIMETABLE_DATE_RANGE",
        "بازه تاریخ معتبر تا دو سال انتخاب کنید.",
      );
    }
  }
  private times(start: string, end: string) {
    try {
      if (minuteOf(end) <= minuteOf(start)) throw Error();
    } catch {
      this.fail("TIMETABLE_TIME_RANGE", "زمان پایان باید بعد از شروع باشد.");
    }
  }
  private async term(manager: EntityManager, id: string) {
    const term = await manager.findOneBy(TimetableTerm, { id });
    const year =
      term &&
      (await manager.findOneBy(TimetableAcademicYear, { id: term.yearId }));
    if (!term || !year)
      this.fail("TIMETABLE_NOT_FOUND", "نیم‌سال پیدا نشد.", 404);
    return { term, year };
  }
  private async version(
    user: AuthenticatedUser,
    id: string,
    capability: string,
    manager = this.database.manager,
  ) {
    const version = await manager.findOneBy(TimetableVersion, { id });
    if (!version)
      this.fail("TIMETABLE_NOT_FOUND", "نسخه برنامه پیدا نشد.", 404);
    const { term, year } = await this.term(manager, version.termId);
    await this.school(user, year.organizationId, capability);
    return { version, term, year };
  }
  private revision(version: TimetableVersion, expected: number, draft = true) {
    if (draft && version.state !== "DRAFT")
      this.fail(
        "TIMETABLE_IMMUTABLE",
        "نسخه منتشرشده را در پیش‌نویس جدید تغییر دهید.",
        409,
      );
    if (version.revision !== expected)
      this.fail(
        "TIMETABLE_STALE",
        "برنامه تغییر کرده است؛ دوباره بارگذاری کنید.",
        409,
      );
  }
  private async audit(
    manager: EntityManager,
    user: AuthenticatedUser,
    version: TimetableVersion,
    action: string,
    beforeText: string,
    afterText: string,
    reason: string,
    lessonId: string | null = null,
  ) {
    await manager.save(
      TimetableChange,
      manager.create(TimetableChange, {
        versionId: version.id,
        lessonId,
        action,
        beforeText,
        afterText,
        reason,
        actorId: user.id,
        actorName: this.name(user),
      }),
    );
  }
  private versionView(row: TimetableVersion): VersionContract {
    return {
      id: row.id,
      termId: row.termId,
      name: row.name,
      state: row.state,
      revision: row.revision,
      effectiveOn: row.effectiveOn,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      reason: row.reason,
      createdAt: row.createdAt.toISOString(),
    };
  }
  private async teacher(
    manager: EntityManager,
    id: string,
    organizationId: string,
  ) {
    const membership = await manager.findOne(OrganizationMembership, {
      where: {
        user: { id, status: UserStatus.ACTIVE },
        organization: { id: organizationId },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: true },
    });
    const roles =
      membership &&
      (await manager.find(UserRoleAssignment, {
        where: { user: { id }, membership: { id: membership.id } },
        relations: { role: true },
      }));
    if (!membership || !roles?.some((row) => row.role.code === "TEACHER"))
      this.fail(
        "TIMETABLE_TEACHER_SCOPE",
        "استاد باید حساب فعال تدریس در این مدرسه داشته باشد.",
      );
    return membership.user;
  }
  private async lessonBatch(
    manager: EntityManager,
    items: Array<{ id?: string; lesson: TimetableLessonDto }>,
    year: TimetableAcademicYear,
    version: TimetableVersion,
  ): Promise<LessonBatch> {
    const ids = (
      key:
        "classroomId" | "classBookId" | "periodId" | "teacherId" | "locationId",
    ) => [
      ...new Set(
        items.map((i) => i.lesson[key]).filter((id): id is string => !!id),
      ),
    ];
    const map = <T extends { id: string }>(rows: T[]) =>
      new Map(rows.map((r) => [r.id, r]));
    const classes = await manager.find(EducationClass, {
      where: {
        id: In(ids("classroomId")),
        organization: { id: year.organizationId },
        status: "ACTIVE",
      },
      relations: { organization: true },
    });
    const books = await manager.find(EducationClassBook, {
      where: { id: In(ids("classBookId")) },
      relations: { book: true, teacher: true, classroom: true },
    });
    const periods = await manager.findBy(TimetablePeriod, {
      id: In(ids("periodId")),
    });
    const sessions = periods.length
      ? await manager.findBy(TimetableDailySession, {
          id: In([...new Set(periods.map((p) => p.sessionId))]),
        })
      : [];
    const bells = sessions.length
      ? await manager.findBy(TimetableBellSchedule, {
          id: In([...new Set(sessions.map((p) => p.bellId))]),
        })
      : [];
    const roles = ids("teacherId").length
      ? await manager.find(UserRoleAssignment, {
          where: {
            user: { id: In(ids("teacherId")), status: UserStatus.ACTIVE },
            role: { code: "TEACHER" },
            membership: {
              organization: { id: year.organizationId },
              status: MembershipStatus.ACTIVE,
            },
          },
          relations: { user: true },
        })
      : [];
    const locations = ids("locationId").length
      ? await manager.findBy(TimetableLocation, {
          id: In(ids("locationId")),
          organizationId: year.organizationId,
        })
      : [];
    const existingIds = items.flatMap((i) => (i.id ? [i.id] : []));
    const existing = existingIds.length
      ? await manager.findBy(SchoolScheduleEntry, {
          id: In(existingIds),
          versionId: version.id,
        })
      : [];
    const references = await manager.findBy(SubjectBookReference, {
      organizationId: year.organizationId,
    });
    const assignments = await manager.findBy(TeachingAssignment, {
      organizationId: year.organizationId,
      classroomId: In(ids("classroomId")),
    });
    return {
      classes: map(classes),
      books: map(books),
      periods: map(periods),
      sessions: map(sessions),
      bells: map(bells),
      teachers: map(roles.map((r) => r.user)),
      locations: map(locations),
      existing: map(existing),
      references,
      assignments,
    };
  }
  private async validateLesson(
    manager: EntityManager,
    dto: TimetableLessonDto,
    version: TimetableVersion,
    term: TimetableTerm,
    year: TimetableAcademicYear,
    batch?: LessonBatch,
  ) {
    this.dates(dto.startsOn, dto.endsOn);
    this.times(dto.startTime, dto.endTime);
    if (
      dto.startsOn < term.startsOn ||
      dto.endsOn > term.endsOn ||
      dto.startsOn < version.effectiveOn
    )
      this.fail(
        "TIMETABLE_LESSON_DATES",
        "تاریخ درس باید در بازه نیم‌سال و نسخه باشد.",
      );
    const classroom = batch
      ? (batch.classes.get(dto.classroomId) ?? null)
      : await manager.findOne(EducationClass, {
          where: {
            id: dto.classroomId,
            organization: { id: year.organizationId },
            status: "ACTIVE",
          },
          relations: { organization: true },
        });
    const book = batch
      ? (batch.books.get(dto.classBookId) ?? null)
      : await manager.findOne(EducationClassBook, {
          where: { id: dto.classBookId, classroom: { id: dto.classroomId } },
          relations: { book: true, teacher: true },
        });
    const period = batch
      ? (batch.periods.get(dto.periodId) ?? null)
      : await manager.findOneBy(TimetablePeriod, {
          id: dto.periodId,
        });
    const session =
      period &&
      (batch
        ? batch.sessions.get(period.sessionId)
        : await manager.findOneBy(TimetableDailySession, {
            id: period.sessionId,
          }));
    const bell =
      session &&
      (batch
        ? batch.bells.get(session.bellId)
        : await manager.findOneBy(TimetableBellSchedule, {
            id: session.bellId,
          }));
    if (
      !classroom ||
      !book ||
      (batch && book.classroom.id !== dto.classroomId) ||
      !bell ||
      bell.organizationId !== year.organizationId
    )
      this.fail(
        "TIMETABLE_LESSON_SCOPE",
        "کلاس، کتاب و زنگ باید متعلق به همین مدرسه باشند.",
      );
    if (bell.sectionId && bell.sectionId !== classroom.timetableSectionId)
      this.fail(
        "TIMETABLE_SECTION_MISMATCH",
        "زنگ انتخاب‌شده متعلق به بخش کلاس نیست.",
      );
    const teacher = dto.teacherId
      ? batch
        ? (batch.teachers.get(dto.teacherId) ?? null)
        : await this.teacher(manager, dto.teacherId, year.organizationId)
      : null;
    if (dto.teacherId && !teacher)
      this.fail(
        "TIMETABLE_TEACHER_SCOPE",
        "استاد باید حساب فعال تدریس در مدرسه داشته باشد.",
      );
    if (teacher && book.teacher.id !== teacher.id) {
      const refs = batch
        ? batch.references.filter((r) => r.bookId === book.book.id)
        : await manager.findBy(SubjectBookReference, {
            organizationId: year.organizationId,
            bookId: book.book.id,
          });
      const assigned = batch
        ? batch.assignments.some(
            (a) =>
              a.classroomId === classroom.id &&
              a.teacherId === teacher.id &&
              refs.some((r) => r.subjectId === a.subjectId) &&
              a.startsOn <= dto.startsOn &&
              a.endsOn >= dto.endsOn,
          )
        : refs.length
          ? await manager
              .getRepository(TeachingAssignment)
              .createQueryBuilder("a")
              .where(
                "a.organizationId = :org AND a.classroomId = :classroom AND a.teacherId = :teacher AND a.subjectId IN (:...subjects)",
                {
                  org: year.organizationId,
                  classroom: classroom.id,
                  teacher: teacher.id,
                  subjects: refs.map((r) => r.subjectId),
                },
              )
              .andWhere("a.startsOn <= :start AND a.endsOn >= :end", {
                start: dto.startsOn,
                end: dto.endsOn,
              })
              .getExists()
          : false;
      if (!assigned)
        this.fail(
          "TIMETABLE_TEACHING_ASSIGNMENT",
          "استاد به این کلاس و درس واگذار نشده است.",
        );
    }
    const location = dto.locationId
      ? batch
        ? (batch.locations.get(dto.locationId) ?? null)
        : await manager.findOneBy(TimetableLocation, {
            id: dto.locationId,
            organizationId: year.organizationId,
          })
      : null;
    if (dto.locationId && !location)
      this.fail("TIMETABLE_LOCATION_SCOPE", "اتاق در این مدرسه پیدا نشد.");
    if (classroom.academicYearId && classroom.academicYearId !== year.id)
      this.fail("TIMETABLE_CLASS_YEAR", "کلاس متعلق به سال تحصیلی نسخه نیست.");
    return { classroom, book, teacher, location };
  }
  private async lessonViews(
    manager: EntityManager,
    versionId: string | string[],
  ): Promise<TimetableLesson[]> {
    const rows = await manager.find(SchoolScheduleEntry, {
      where: {
        versionId: Array.isArray(versionId) ? In(versionId) : versionId,
        status: "ACTIVE",
      },
      relations: { classroom: true, classBook: { book: true }, teacher: true },
      order: { weekday: "ASC", startTime: "ASC" },
    });
    const periodIds = [
      ...new Set(
        rows.map((row) => row.periodId).filter((id): id is string => !!id),
      ),
    ];
    const periods = periodIds.length
      ? await manager.findBy(TimetablePeriod, { id: In(periodIds) })
      : [];
    const sessionIds = [...new Set(periods.map((p) => p.sessionId))];
    const sessions = sessionIds.length
      ? await manager.findBy(TimetableDailySession, { id: In(sessionIds) })
      : [];
    const periodBy = new Map(periods.map((p) => [p.id, p]));
    const sessionBy = new Map(sessions.map((p) => [p.id, p]));
    return rows.map((row) => ({
      id: row.id,
      versionId: row.versionId!,
      classroomId: row.classroom!.id,
      classBookId: row.classBook!.id,
      teacherId: row.teacher?.id ?? null,
      periodId: row.periodId!,
      locationId: row.locationId,
      weekday: row.weekday,
      startTime: row.startTime,
      endTime: row.endTime,
      startsOn: row.startsOn!,
      endsOn: row.endsOn!,
      notes: row.notes,
      title: row.title,
      classroomName: row.classroomNameSnapshot || row.classroom!.name,
      teacherName:
        row.teacherNameSnapshot ||
        (row.teacher ? this.person(row.teacher) : "استاد تعیین نشده"),
      locationName: row.room,
      sectionId: row.classroom!.timetableSectionId,
      gradeId: row.classroom!.gradeId,
      periodName: periodBy.get(row.periodId!)?.name ?? "",
      sessionKind:
        sessionBy.get(periodBy.get(row.periodId!)?.sessionId ?? "")?.kind ??
        "OTHER",
    }));
  }
  private async versionData(
    manager: EntityManager,
    version: TimetableVersion,
    term: TimetableTerm,
    year: TimetableAcademicYear,
  ) {
    const lessons = await this.lessonViews(manager, version.id);
    const overrides = (
      await manager.find(TimetableOverride, {
        where: { versionId: version.id },
      })
    ).map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })) as OverrideContract[];
    const holidays = await manager.find(TimetableHoliday, {
      where: { termId: term.id },
    });
    const availability = await manager.find(TimetableTeacherAvailability, {
      where: { organizationId: year.organizationId },
    });
    const allocations = await manager.find(TimetableAllocation, {
      where: { versionId: version.id },
    });
    const bells = await manager.find(TimetableBellSchedule, {
      where: { organizationId: year.organizationId },
    });
    const sessions = bells.length
      ? await manager.find(TimetableDailySession, {
          where: { bellId: In(bells.map((x) => x.id)) },
        })
      : [];
    const periods = sessions.length
      ? await manager.find(TimetablePeriod, {
          where: { sessionId: In(sessions.map((x) => x.id)) },
        })
      : [];
    const locations = await manager.findBy(TimetableLocation, {
      organizationId: year.organizationId,
    });
    const counts = await manager
      .getRepository(EducationClassEnrollment)
      .createQueryBuilder("e")
      .innerJoin("e.student", "student")
      .innerJoin("e.classroom", "classroom")
      .select("e.classroomId", "id")
      .addSelect("COUNT(*)", "count")
      .where(
        "classroom.organizationId = :org AND student.accountStatus = :active",
        { org: year.organizationId, active: "active" },
      )
      .groupBy("e.classroomId")
      .getRawMany<{ id: string; count: number }>();
    return {
      locations,
      classSizes: Object.fromEntries(
        counts.map((r) => [r.id, Number(r.count)]),
      ),
      lessons,
      overrides,
      holidays,
      availability,
      allocations,
      bells,
      sessions,
      periods,
      startsOn:
        version.effectiveOn > term.startsOn
          ? version.effectiveOn
          : term.startsOn,
      endsOn: term.endsOn,
      timeZone: year.timeZone,
    };
  }
  private async checkConflicts(
    manager: EntityManager,
    version: TimetableVersion,
    term: TimetableTerm,
    year: TimetableAcademicYear,
    data: Awaited<ReturnType<TimetableService["versionData"]>>,
  ) {
    const conflicts = detectTimetableConflicts(data);
    const years = await manager.findBy(TimetableAcademicYear, {
      organizationId: year.organizationId,
    });
    const terms = await manager.findBy(TimetableTerm, {
      yearId: In(years.map((y) => y.id)),
    });
    const relevant = terms.filter(
      (t) =>
        t.id !== term.id &&
        t.startsOn <= data.endsOn &&
        t.endsOn >= data.startsOn,
    );
    if (!relevant.length) return conflicts;
    const peers = (
      await manager.find(TimetableVersion, {
        where: {
          termId: In(relevant.map((t) => t.id)),
          state: In(["PUBLISHED", "ARCHIVED"] as const),
        },
      })
    ).filter((v) => !!v.publishedAt);
    const current = occurrencesForRange(
      data.lessons,
      data.overrides,
      data.holidays,
      data.startsOn,
      data.endsOn,
      year.timeZone,
    ).filter((o) => !o.cancelled);
    const seen = new Set<string>();
    if (!peers.length) return conflicts;
    const peerIds = peers.map((p) => p.id);
    const allLessons = await this.lessonViews(manager, peerIds);
    const allOverrides = await manager.findBy(TimetableOverride, {
      versionId: In(peerIds),
    });
    const allHolidays = await manager.findBy(TimetableHoliday, {
      termId: In(relevant.map((t) => t.id)),
    });
    current.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    for (const peer of peers) {
      const peerTerm = relevant.find((t) => t.id === peer.termId)!;
      const peerYear = years.find((y) => y.id === peerTerm.yearId)!;
      const successor = peers
        .filter(
          (v) =>
            v.termId === peer.termId &&
            (v.effectiveOn > peer.effectiveOn ||
              (v.effectiveOn === peer.effectiveOn &&
                v.publishedAt!.getTime() > peer.publishedAt!.getTime())),
        )
        .sort((a, b) => a.effectiveOn.localeCompare(b.effectiveOn))[0];
      const from = [data.startsOn, peer.effectiveOn, peerTerm.startsOn]
        .sort()
        .at(-1)!;
      const to = [
        data.endsOn,
        peerTerm.endsOn,
        ...(successor ? [addDays(successor.effectiveOn, -1)] : []),
      ].sort()[0];
      if (to < from) continue;
      const occurrences = occurrencesForRange(
        allLessons.filter((l) => l.versionId === peer.id),
        allOverrides
          .filter((o) => o.versionId === peer.id)
          .map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
        allHolidays.filter((h) => h.termId === peerTerm.id),
        from,
        to,
        peerYear.timeZone,
      )
        .filter((o) => !o.cancelled)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      let first = 0;
      for (const a of current) {
        while (
          first < occurrences.length &&
          occurrences[first].endsAt <= a.startsAt
        )
          first++;
        for (
          let index = first;
          index < occurrences.length && occurrences[index].startsAt < a.endsAt;
          index++
        ) {
          const b = occurrences[index];
          if (a.startsAt >= b.endsAt || b.startsAt >= a.endsAt) continue;
          const codes: Array<
            "CLASS_OVERLAP" | "TEACHER_OVERLAP" | "ROOM_OVERLAP"
          > = [];
          if (a.classroomId === b.classroomId) codes.push("CLASS_OVERLAP");
          if (a.teacherId && a.teacherId === b.teacherId)
            codes.push("TEACHER_OVERLAP");
          if (a.locationId && a.locationId === b.locationId)
            codes.push("ROOM_OVERLAP");
          for (const code of codes) {
            const key = `${code}:${a.id}:${b.id}:${a.date}`;
            if (seen.has(key)) continue;
            seen.add(key);
            conflicts.push({
              code,
              lessonIds: [a.id, b.id],
              date: a.date,
              message: "تداخل با برنامه مؤثر نیم‌سال دیگر مدرسه.",
              alternatives: ["انتخاب منبع آزاد یا اصلاح بازه"],
            });
          }
        }
      }
    }
    return conflicts;
  }
  private async workspaceConflicts(
    manager: EntityManager,
    version: TimetableVersion,
    data: Awaited<ReturnType<TimetableService["versionData"]>>,
  ) {
    const { term, year } = await this.term(manager, version.termId);
    if (data.lessons.some((l) => l.versionId !== version.id))
      return detectTimetableConflicts(data);
    return this.checkConflicts(manager, version, term, year, data);
  }
  async conflicts(user: AuthenticatedUser, id: string) {
    const { version, term, year } = await this.version(
      user,
      id,
      "schedule.read.all",
    );
    const data = await this.versionData(
      this.database.manager,
      version,
      term,
      year,
    );
    return {
      revision: version.revision,
      conflicts: await this.checkConflicts(
        this.database.manager,
        version,
        term,
        year,
        data,
      ),
    };
  }
  async workspace(
    user: AuthenticatedUser,
    organizationId: string,
    versionId?: string,
    startsOn?: string,
    rangeEndsOn?: string,
    academicYearId?: string,
  ): Promise<TimetableWorkspace> {
    await this.school(user, organizationId);
    const manager = this.database.manager;
    const years = await manager.find(TimetableAcademicYear, {
      where: { organizationId },
      order: { startsOn: "DESC" },
    });
    if (academicYearId && !years.some((y) => y.id === academicYearId))
      this.fail("TIMETABLE_NOT_FOUND", "سال تحصیلی در مدرسه پیدا نشد.", 404);
    const terms = years.length
      ? await manager.find(TimetableTerm, {
          where: { yearId: In(years.map((x) => x.id)) },
        })
      : [];
    const full = !!user.capabilities?.includes("schedule.read.all");
    const versions = terms.length
      ? await manager.find(TimetableVersion, {
          where: {
            termId: In(terms.map((x) => x.id)),
            ...(full ? {} : { state: In(["PUBLISHED", "ARCHIVED"] as const) }),
          },
          order: { createdAt: "DESC" },
        })
      : [];
    if (startsOn) {
      try {
        canonicalDate(startsOn);
      } catch {
        this.fail("TIMETABLE_DATE_RANGE", "تاریخ هفته معتبر نیست.");
      }
    }
    const feedDate =
      startsOn ??
      new Intl.DateTimeFormat("en-CA", {
        timeZone: years.find((y) => y.active)?.timeZone ?? "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    const rangeEnd = rangeEndsOn ?? addDays(feedDate, 6);
    this.dates(feedDate, rangeEnd);
    const selected = versionId
      ? versions.find((x) => x.id === versionId)
      : [...versions]
          .filter(
            (x) =>
              x.state !== "DRAFT" &&
              !!x.publishedAt &&
              years.some(
                (y) =>
                  y.id === terms.find((t) => t.id === x.termId)?.yearId &&
                  (academicYearId ? y.id === academicYearId : y.active),
              ) &&
              x.effectiveOn <= rangeEnd &&
              terms.find((t) => t.id === x.termId)!.endsOn >= feedDate,
          )
          .sort(
            (a, b) =>
              b.effectiveOn.localeCompare(a.effectiveOn) ||
              b.publishedAt!.getTime() - a.publishedAt!.getTime(),
          )[0];
    if (!full && selected && !selected.publishedAt)
      this.fail("TIMETABLE_NOT_FOUND", "این نسخه در دسترس نیست.", 404);
    if (versionId && !selected)
      this.fail("TIMETABLE_NOT_FOUND", "این نسخه در دسترس نیست.", 404);
    const classroomRows = await manager.find(EducationClass, {
      where: { organization: { id: organizationId }, status: "ACTIVE" },
      relations: { books: { book: true, teacher: true } },
    });
    const teacherRows = await manager.find(UserRoleAssignment, {
      where: {
        role: { code: "TEACHER" },
        membership: {
          organization: { id: organizationId },
          status: MembershipStatus.ACTIVE,
        },
        user: { status: UserStatus.ACTIVE },
      },
      relations: { user: true },
    });
    const classes = classroomRows.map((row) => ({
      id: row.id,
      name: row.name,
      gradeId: row.gradeId,
      schoolYear: row.schoolYear,
      sectionId: row.timetableSectionId,
      books: (row.books ?? []).map((book) => ({
        id: book.id,
        name: book.book.titleFa,
        teacherId: book.teacher.id,
        teacherName: this.person(book.teacher),
      })),
    }));
    const sections = await manager.find(TimetableSection, {
      where: { organizationId },
    });
    const locations = await manager.find(TimetableLocation, {
      where: { organizationId },
    });
    let data: Awaited<ReturnType<TimetableService["versionData"]>> | null =
      null;
    if (selected) {
      const { term, year } = await this.term(manager, selected.termId);
      data = await this.versionData(manager, selected, term, year);
    }
    // Compose week transitions from immutable versions without rewriting stored dates.
    if (!versionId && startsOn && data) {
      const feedVersions = versions.filter(
        (v) =>
          v.state !== "DRAFT" &&
          !!v.publishedAt &&
          years.some(
            (y) =>
              y.id === terms.find((t) => t.id === v.termId)?.yearId &&
              (academicYearId ? y.id === academicYearId : y.active),
          ) &&
          v.effectiveOn <= rangeEnd &&
          terms.find((t) => t.id === v.termId)!.endsOn >= startsOn,
      );
      const feedLessons: TimetableLesson[] = [];
      const feedOverrides: OverrideContract[] = [];
      const feedHolidays: Array<TimetableHoliday & { versionId: string }> = [];
      for (const version of feedVersions) {
        const scope = await this.term(manager, version.termId);
        const snapshot = await this.versionData(
          manager,
          version,
          scope.term,
          scope.year,
        );
        const successor = versions
          .filter(
            (v) =>
              v.termId === version.termId &&
              v.state !== "DRAFT" &&
              !!v.publishedAt &&
              (v.effectiveOn > version.effectiveOn ||
                (v.effectiveOn === version.effectiveOn &&
                  v.publishedAt!.getTime() > version.publishedAt!.getTime())),
          )
          .sort((a, b) => a.effectiveOn.localeCompare(b.effectiveOn))[0];
        const endsOn = successor
          ? addDays(successor.effectiveOn, -1)
          : scope.term.endsOn;
        feedLessons.push(
          ...snapshot.lessons
            .filter((l) => l.startsOn <= endsOn)
            .map((l) => ({
              ...l,
              endsOn: l.endsOn > endsOn ? endsOn : l.endsOn,
            })),
        );
        feedOverrides.push(...snapshot.overrides);
        feedHolidays.push(
          ...snapshot.holidays.map((h) => ({ ...h, versionId: version.id })),
        );
      }
      data = {
        ...data,
        lessons: feedLessons,
        overrides: feedOverrides,
        holidays: [
          ...new Map(
            feedHolidays.map((x) => [`${x.id}:${x.versionId}`, x]),
          ).values(),
        ],
      };
    }
    const bells =
      data?.bells ??
      (await manager.find(TimetableBellSchedule, {
        where: { organizationId },
      }));
    const sessions =
      data?.sessions ??
      (bells.length
        ? await manager.find(TimetableDailySession, {
            where: { bellId: In(bells.map((x) => x.id)) },
          })
        : []);
    const periods =
      data?.periods ??
      (sessions.length
        ? await manager.find(TimetablePeriod, {
            where: { sessionId: In(sessions.map((x) => x.id)) },
          })
        : []);
    const effectiveRoles = user.roles?.length ? user.roles : [user.role];
    const teaching = effectiveRoles.includes("TEACHER");
    const studying = effectiveRoles.includes("STUDENT");
    const studentClasses = new Set<string>();
    if (!full && studying) {
      const enrollments = await manager.find(EducationClassEnrollment, {
        where: {
          student: { user: { id: user.id }, accountStatus: "active" },
          classroom: { organization: { id: organizationId } },
        },
        relations: { classroom: true },
      });
      for (const enrollment of enrollments)
        studentClasses.add(enrollment.classroom.id);
    }
    if (!full && effectiveRoles.includes("GUARDIAN")) {
      const relationships = await manager.find(UserRelationship, {
        where: {
          fromUser: { id: user.id },
          organization: { id: organizationId },
          type: RelationshipType.GUARDIAN_OF,
          status: RelationshipStatus.ACTIVE,
        },
        relations: { toStudent: true },
      });
      const childIds = relationships.map((r) => r.toStudent.id);
      const enrollments = childIds.length
        ? await manager.find(EducationClassEnrollment, {
            where: {
              student: { id: In(childIds), accountStatus: "active" },
              classroom: { organization: { id: organizationId } },
            },
            relations: { classroom: true },
          })
        : [];
      for (const row of enrollments) studentClasses.add(row.classroom.id);
    }
    const ownTeachingLesson = (lesson: TimetableLesson) =>
      teaching &&
      (lesson.teacherId === user.id ||
        data?.overrides.some(
          (change) =>
            change.lessonId === lesson.id && change.teacherId === user.id,
        ));
    const lessons = (data?.lessons ?? []).filter(
      (lesson) =>
        full ||
        studentClasses.has(lesson.classroomId) ||
        ownTeachingLesson(lesson),
    );
    const allowedClasses = new Set(lessons.map((lesson) => lesson.classroomId));
    for (const id of studentClasses) allowedClasses.add(id);
    const overrides = (data?.overrides ?? []).filter((x) =>
      lessons.some((l) => l.id === x.lessonId),
    );
    let occurrences: TimetableWorkspace["occurrences"] = [];
    if (data && startsOn) {
      this.dates(startsOn, rangeEnd);
      occurrences = occurrencesForRange(
        lessons,
        overrides,
        data.holidays,
        startsOn,
        rangeEnd,
        data.timeZone,
      );
      const linked = lessons.length
        ? await manager.find(TimetableOccurrence, {
            where: { lessonId: In(lessons.map((x) => x.id)) },
          })
        : [];
      if (!full)
        occurrences = occurrences.filter(
          (occurrence) =>
            studentClasses.has(occurrence.classroomId) ||
            (teaching && occurrence.teacherId === user.id),
        );
      occurrences = occurrences.map((row) => ({
        ...row,
        attendanceSessionId:
          linked.find((x) => x.lessonId === row.id && x.date === row.date)
            ?.attendanceSessionId ?? null,
        teacherName:
          row.teacherId === lessons.find((x) => x.id === row.id)?.teacherId
            ? row.teacherName
            : teacherRows.find((x) => x.user.id === row.teacherId)
              ? this.person(
                  teacherRows.find((x) => x.user.id === row.teacherId)!.user,
                )
              : row.teacherName,
        locationName:
          locations.find((x) => x.id === row.locationId)?.name ??
          row.locationName,
      }));
    }
    return {
      organizationId,
      years,
      terms,
      sections,
      locations,
      bells,
      sessions,
      periods,
      versions: versions
        .filter((v) => full || !!v.publishedAt)
        .map((x) => this.versionView(x)),
      lessons,
      overrides,
      holidays: data?.holidays ?? [],
      availability: full ? (data?.availability ?? []) : [],
      allocations: full ? (data?.allocations ?? []) : [],
      changes:
        full && selected
          ? (
              await manager.find(TimetableChange, {
                where: { versionId: selected.id },
                order: { createdAt: "DESC" },
                take: 100,
              })
            ).map((x) => ({ ...x, createdAt: x.createdAt.toISOString() }))
          : [],
      classes: classes.filter((x) => full || allowedClasses.has(x.id)),
      teachers: full
        ? [
            ...new Map(
              teacherRows.map((x) => [
                x.user.id,
                { id: x.user.id, name: this.person(x.user) },
              ]),
            ).values(),
          ]
        : [],
      conflicts:
        full && data && selected
          ? await this.workspaceConflicts(manager, selected, data)
          : [],
      occurrences,
    };
  }
  async occurrences(
    user: AuthenticatedUser,
    organizationId: string,
    query: TimetableQueryDto,
  ) {
    await this.school(user, organizationId);
    const activeYear = await this.database.manager.findOneBy(
      TimetableAcademicYear,
      { organizationId, active: true },
    );
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: activeYear?.timeZone ?? "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const from = query.startsOn ?? today,
      to = query.endsOn ?? addDays(from, query.view === "DAILY" ? 0 : 6);
    this.dates(from, to);
    if (Date.parse(to) - Date.parse(from) > 30 * 86400000)
      this.fail("TIMETABLE_QUERY_LIMIT", "حداکثر ۳۱ روز را انتخاب کنید.");
    const workspace = await this.workspace(
      user,
      organizationId,
      query.versionId,
      from,
      to,
      query.academicYearId,
    );
    let studentClasses: Set<string> | null = null;
    if (query.studentId) {
      const student = await this.database.manager.findOne(Student, {
        where: { id: query.studentId, organization: { id: organizationId } },
        relations: { user: true },
      });
      if (!student)
        this.fail("STUDENT_NOT_FOUND", "دانش‌آموز در این مدرسه پیدا نشد.", 404);
      const full = user.capabilities?.includes("schedule.read.all");
      const guardian = await this.database.manager.exists(UserRelationship, {
        where: {
          fromUser: { id: user.id },
          toStudent: { id: student.id },
          organization: { id: organizationId },
          type: RelationshipType.GUARDIAN_OF,
          status: RelationshipStatus.ACTIVE,
        },
      });
      if (!full && student.user?.id !== user.id && !guardian)
        this.fail("FORBIDDEN", "دانش‌آموز خارج از دامنه دسترسی است.", 403);
      const enrollments = await this.database.manager.find(
        EducationClassEnrollment,
        {
          where: { student: { id: student.id } },
          relations: { classroom: true },
        },
      );
      studentClasses = new Set(enrollments.map((r) => r.classroom.id));
    }
    const allowedVersions = query.academicYearId
      ? new Set(
          workspace.versions
            .filter((v) =>
              workspace.terms.some(
                (t) => t.id === v.termId && t.yearId === query.academicYearId,
              ),
            )
            .map((v) => v.id),
        )
      : null;
    const rows = workspace.occurrences
      .filter(
        (o) =>
          (!query.classroomId || o.classroomId === query.classroomId) &&
          (!query.teacherId || o.teacherId === query.teacherId) &&
          (!query.locationId || o.locationId === query.locationId) &&
          (!studentClasses || studentClasses.has(o.classroomId)) &&
          (!allowedVersions || allowedVersions.has(o.versionId)),
      )
      .sort(
        (a, b) =>
          a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id),
      );
    return {
      items: rows.slice(query.offset, query.offset + query.limit),
      total: rows.length,
      offset: query.offset,
      limit: query.limit,
    };
  }
  /** Read-only operations view of scheduled occurrences and attendance evidence. */
  async attendanceReport(
    user: AuthenticatedUser,
    organizationId: string,
    query: TimetableQueryDto,
  ): Promise<TimetableAttendanceReport> {
    await this.school(user, organizationId, "schedule.read.all");
    const activeYear = await this.database.manager.findOneBy(
      TimetableAcademicYear,
      { organizationId, active: true },
    );
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: activeYear?.timeZone ?? "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const startsOn = query.startsOn ?? today;
    const endsOn = query.endsOn ?? addDays(startsOn, 6);
    this.dates(startsOn, endsOn);
    if (Date.parse(endsOn) - Date.parse(startsOn) > 31 * 86400000)
      this.fail("TIMETABLE_QUERY_LIMIT", "حداکثر ۳۲ روز را انتخاب کنید.");
    const workspace = await this.workspace(
      user,
      organizationId,
      query.versionId,
      startsOn,
      endsOn,
      query.academicYearId,
    );
    const occurrences = workspace.occurrences.filter(
      (row) =>
        (!query.classroomId || row.classroomId === query.classroomId) &&
        (!query.teacherId || row.teacherId === query.teacherId) &&
        (!query.locationId || row.locationId === query.locationId),
    );
    const sessionIds = occurrences
      .map((row) => row.attendanceSessionId)
      .filter((id): id is string => !!id);
    const records = sessionIds.length
      ? await this.database.manager.find(AttendanceRecord, {
          where: { session: { id: In(sessionIds) } },
          relations: { session: true },
        })
      : [];
    const recordedSessions = new Set(records.map((row) => row.session.id));
    const summary = (rows: typeof occurrences) => {
      const planned = rows.filter((row) => !row.cancelled);
      const attendanceOpened = planned.filter(
        (row) => !!row.attendanceSessionId,
      );
      const attendanceRecorded = attendanceOpened.filter((row) =>
        recordedSessions.has(row.attendanceSessionId!),
      );
      return {
        planned: planned.length,
        cancelled: rows.length - planned.length,
        attendanceOpened: attendanceOpened.length,
        attendanceRecorded: attendanceRecorded.length,
        awaitingAttendance: planned.length - attendanceOpened.length,
      };
    };
    const classes = [
      ...new Map(occurrences.map((row) => [row.classroomId, row])).values(),
    ]
      .map((sample) => ({
        classroomId: sample.classroomId,
        classroomName: sample.classroomName,
        ...summary(
          occurrences.filter((row) => row.classroomId === sample.classroomId),
        ),
      }))
      .sort((a, b) => a.classroomName.localeCompare(b.classroomName, "fa"));
    const subjects = [
      ...new Map(occurrences.map((row) => [row.classBookId, row])).values(),
    ]
      .map((sample) => ({
        subjectId: sample.classBookId,
        subjectName: sample.title,
        ...summary(
          occurrences.filter((row) => row.classBookId === sample.classBookId),
        ),
      }))
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName, "fa"));
    return { startsOn, endsOn, ...summary(occurrences), classes, subjects };
  }
  async versions(
    user: AuthenticatedUser,
    organizationId: string,
    query: TimetableQueryDto,
  ) {
    await this.school(user, organizationId);
    const builder = this.database.manager
      .getRepository(TimetableVersion)
      .createQueryBuilder("v")
      .innerJoin("v.term", "term")
      .innerJoin("term.year", "year")
      .where("year.organizationId = :org", { org: organizationId });
    if (!user.capabilities?.includes("schedule.read.all"))
      builder.andWhere("v.publishedAt IS NOT NULL");
    if (query.academicYearId)
      builder.andWhere("year.id = :year", { year: query.academicYearId });
    if (query.startsOn)
      builder.andWhere("term.endsOn >= :start", { start: query.startsOn });
    if (query.endsOn)
      builder.andWhere("v.effectiveOn <= :end", { end: query.endsOn });
    const [items, total] = await builder
      .orderBy("v.createdAt", "DESC")
      .addOrderBy("v.id", "DESC")
      .skip(query.offset)
      .take(query.limit)
      .getManyAndCount();
    return {
      items: items.map((v) => this.versionView(v)),
      total,
      offset: query.offset,
      limit: query.limit,
    };
  }
  async history(user: AuthenticatedUser, id: string, page: TimetablePageDto) {
    await this.version(user, id, "schedule.read.all");
    const [items, total] = await this.database.manager.findAndCount(
      TimetableChange,
      {
        where: { versionId: id },
        order: { createdAt: "DESC", id: "DESC" },
        skip: page.offset,
        take: page.limit,
      },
    );
    return {
      items: items.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      total,
      offset: page.offset,
      limit: page.limit,
    };
  }
  async archive(user: AuthenticatedUser, id: string, dto: TimetablePublishDto) {
    return attendanceTransaction(this.database.manager, async (manager) => {
      const { version } = await this.version(
        user,
        id,
        "schedule.archive",
        manager,
      );
      this.revision(version, dto.expectedRevision);
      version.state = "ARCHIVED";
      version.revision++;
      version.reason = dto.reason;
      await manager.save(version);
      await this.audit(
        manager,
        user,
        version,
        "draft.archived",
        "DRAFT",
        "ARCHIVED",
        dto.reason,
      );
      return this.versionView(version);
    });
  }
  async bulk(
    user: AuthenticatedUser,
    id: string,
    dto: TimetableBulkDto,
    preview = false,
  ) {
    return attendanceTransaction(this.database.manager, async (manager) => {
      const { version, term, year } = await this.version(
        user,
        id,
        "schedule.update",
        manager,
      );
      this.revision(version, dto.expectedRevision);
      const ids = dto.items.flatMap((i) => (i.id ? [i.id] : []));
      if (new Set(ids).size !== ids.length)
        this.fail(
          "TIMETABLE_BULK_DUPLICATE",
          "شناسه درس در درخواست تکراری است.",
        );
      const data = await this.versionData(manager, version, term, year);
      const batch = await this.lessonBatch(manager, dto.items, year, version);
      for (let index = 0; index < dto.items.length; index++) {
        const item = dto.items[index];
        this.capability(user, item.id ? "schedule.update" : "schedule.create");
        if (item.id && !data.lessons.some((l) => l.id === item.id))
          this.fail("TIMETABLE_NOT_FOUND", "درس متعلق به نسخه نیست.", 404);
        const ctx = await this.validateLesson(
          manager,
          item.lesson,
          version,
          term,
          year,
          batch,
        );
        data.lessons = data.lessons.filter((l) => l.id !== item.id);
        data.lessons.push({
          ...item.lesson,
          id: item.id ?? `bulk:${index}`,
          versionId: id,
          title: ctx.book.book.titleFa,
          classroomName: ctx.classroom.name,
          teacherName: ctx.teacher ? this.person(ctx.teacher) : "",
          locationName: ctx.location?.name ?? "",
          sectionId: ctx.classroom.timetableSectionId,
          gradeId: ctx.classroom.gradeId,
          periodName: "",
          sessionKind: "OTHER",
        });
      }
      if (data.lessons.length > 500)
        this.fail("TIMETABLE_LIMIT", "حداکثر ۵۰۰ درس در هر نسخه مجاز است.");
      const conflicts = (
        await this.checkConflicts(manager, version, term, year, data)
      ).filter(
        (c) => c.code !== "INCOMPLETE_ALLOCATION" && c.code !== "UNASSIGNED",
      );
      if (preview)
        return {
          valid: !conflicts.length,
          conflicts,
          revision: version.revision,
        };
      if (conflicts.length)
        this.fail(
          "TIMETABLE_CONFLICT",
          "عملیات گروهی تداخل دارد.",
          409,
          conflicts,
        );
      const rows = [];
      for (const item of dto.items)
        rows.push(
          await this.saveLesson(
            manager,
            user,
            version,
            term,
            year,
            item.lesson,
            item.id,
            batch,
          ),
        );
      version.revision++;
      await manager.save(version);
      return { ids: rows.map((r) => r.id), revision: version.revision };
    });
  }
  async createVersion(
    user: AuthenticatedUser,
    organizationId: string,
    dto: TimetableVersionDto,
  ) {
    await this.school(user, organizationId, "schedule.create");
    return attendanceTransaction(this.database.manager, async (manager) => {
      const { term, year } = await this.term(manager, dto.termId);
      if (year.organizationId !== organizationId)
        this.fail("TIMETABLE_SCOPE", "نیم‌سال متعلق به این مدرسه نیست.");
      this.dates(dto.effectiveOn, dto.effectiveOn);
      if (dto.effectiveOn < term.startsOn || dto.effectiveOn > term.endsOn)
        this.fail("TIMETABLE_DATE_RANGE", "تاریخ اجرا خارج از نیم‌سال است.");
      const version = await manager.save(
        TimetableVersion,
        manager.create(TimetableVersion, {
          termId: term.id,
          name: dto.name,
          state: "DRAFT",
          revision: 0,
          effectiveOn: dto.effectiveOn,
          reason: dto.reason,
          publishedAt: null,
          createdById: user.id,
        }),
      );
      if (dto.copyVersionId) {
        const source = await this.version(
          user,
          dto.copyVersionId,
          "schedule.read.all",
          manager,
        );
        if (
          source.year.organizationId !== organizationId ||
          source.term.id !== term.id
        )
          this.fail(
            "TIMETABLE_COPY_SCOPE",
            "کپی فقط در همان نیم‌سال مجاز است.",
          );
        const rows = await manager.find(SchoolScheduleEntry, {
          where: { versionId: source.version.id, status: "ACTIVE" },
          relations: {
            organization: true,
            classroom: true,
            classBook: true,
            teacher: true,
          },
        });
        for (const row of rows)
          if (row.endsOn! >= version.effectiveOn)
            await manager.save(
              SchoolScheduleEntry,
              manager.create(SchoolScheduleEntry, {
                ...row,
                id: randomUUID(),
                versionId: version.id,
                startsOn:
                  row.startsOn! < version.effectiveOn
                    ? version.effectiveOn
                    : row.startsOn!,
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            );
        const allocations = await manager.find(TimetableAllocation, {
          where: { versionId: source.version.id },
        });
        for (const row of allocations)
          await manager.save(
            TimetableAllocation,
            manager.create(TimetableAllocation, {
              ...row,
              id: randomUUID(),
              versionId: version.id,
            }),
          );
      }
      await this.audit(
        manager,
        user,
        version,
        "draft.created",
        "",
        version.name,
        dto.reason,
      );
      return this.versionView(version);
    });
  }
  private async saveLesson(
    manager: EntityManager,
    user: AuthenticatedUser,
    version: TimetableVersion,
    term: TimetableTerm,
    year: TimetableAcademicYear,
    dto: TimetableLessonDto,
    id?: string,
    batch?: LessonBatch,
  ) {
    const context = await this.validateLesson(
      manager,
      dto,
      version,
      term,
      year,
      batch,
    );
    const existing = id
      ? batch
        ? (batch.existing.get(id) ?? null)
        : await manager.findOneBy(SchoolScheduleEntry, {
            id,
            versionId: version.id,
          })
      : null;
    if (id && !existing) this.fail("TIMETABLE_NOT_FOUND", "درس پیدا نشد.", 404);
    if (
      !batch &&
      !existing &&
      (await manager.countBy(SchoolScheduleEntry, {
        versionId: version.id,
        status: "ACTIVE",
      })) >= 500
    )
      this.fail("TIMETABLE_LIMIT", "حداکثر ۵۰۰ درس در هر نسخه مجاز است.");
    const before = existing
      ? `${existing.title} ${existing.weekday} ${existing.startTime}-${existing.endTime}`
      : "";
    const row = await manager.save(
      SchoolScheduleEntry,
      manager.create(SchoolScheduleEntry, {
        ...(existing ?? {}),
        organization: { id: year.organizationId },
        classroom: context.classroom,
        classBook: context.book,
        teacher: context.teacher,
        versionId: version.id,
        periodId: dto.periodId,
        locationId: dto.locationId ?? null,
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        startsOn: dto.startsOn,
        endsOn: dto.endsOn,
        title: context.book.book.titleFa,
        notes: dto.notes ?? "",
        room: context.location?.name ?? "",
        classroomNameSnapshot: context.classroom.name,
        teacherNameSnapshot: context.teacher
          ? this.person(context.teacher)
          : "",
        status: "ACTIVE",
      }),
    );
    await this.audit(
      manager,
      user,
      version,
      existing ? "lesson.updated" : "lesson.created",
      before,
      `${row.title} ${row.weekday} ${row.startTime}-${row.endTime}`,
      dto.notes ?? "",
      row.id,
    );
    return row;
  }
  async writeLesson(
    user: AuthenticatedUser,
    versionId: string,
    dto: TimetableLessonWriteDto,
    id?: string,
    preview = false,
  ) {
    return attendanceTransaction(this.database.manager, async (manager) => {
      const { version, term, year } = await this.version(
        user,
        versionId,
        id ? "schedule.update" : "schedule.create",
        manager,
      );
      this.revision(version, dto.expectedRevision);
      const context = await this.validateLesson(
        manager,
        dto.lesson,
        version,
        term,
        year,
      );
      const data = await this.versionData(manager, version, term, year);
      const candidate: TimetableLesson = {
        ...dto.lesson,
        id: id ?? "preview",
        versionId,
        title: context.book.book.titleFa,
        classroomName: context.classroom.name,
        teacherName: context.teacher ? this.person(context.teacher) : "",
        locationName: context.location?.name ?? "",
        sectionId: context.classroom.timetableSectionId,
        gradeId: context.classroom.gradeId,
        periodName: "",
        sessionKind: "OTHER",
      };
      data.lessons = [...data.lessons.filter((x) => x.id !== id), candidate];
      const conflicts = (
        await this.checkConflicts(manager, version, term, year, data)
      ).filter(
        (x) =>
          x.lessonIds.includes(candidate.id) &&
          x.code !== "INCOMPLETE_ALLOCATION",
      );
      if (preview) return { conflicts };
      if (conflicts.some((x) => x.code !== "UNASSIGNED"))
        this.fail(
          "TIMETABLE_CONFLICT",
          "تداخل زمانی را پیش از ذخیره برطرف کنید.",
          409,
          conflicts,
        );
      const row = await this.saveLesson(
        manager,
        user,
        version,
        term,
        year,
        dto.lesson,
        id,
      );
      version.revision++;
      await manager.save(version);
      return { id: row.id, revision: version.revision };
    });
  }
  async removeLesson(
    user: AuthenticatedUser,
    versionId: string,
    id: string,
    expectedRevision: number,
  ) {
    return attendanceTransaction(this.database.manager, async (manager) => {
      const { version } = await this.version(
        user,
        versionId,
        "schedule.delete",
        manager,
      );
      this.revision(version, expectedRevision);
      const row = await manager.findOneBy(SchoolScheduleEntry, {
        id,
        versionId,
      });
      if (!row) this.fail("TIMETABLE_NOT_FOUND", "درس پیدا نشد.", 404);
      row.status = "ARCHIVED";
      await manager.save(row);
      version.revision++;
      await manager.save(version);
      await this.audit(
        manager,
        user,
        version,
        "lesson.removed",
        row.title,
        "",
        "حذف از پیش‌نویس",
        id,
      );
      return { revision: version.revision };
    });
  }
  async publish(user: AuthenticatedUser, id: string, dto: TimetablePublishDto) {
    const result = await attendanceTransaction(
      this.database.manager,
      async (manager) => {
        const { version, term, year } = await this.version(
          user,
          id,
          "schedule.publish",
          manager,
        );
        this.revision(version, dto.expectedRevision);
        const approved = (
          await manager.find(TimetableVersion, {
            where: {
              termId: term.id,
              state: In(["PUBLISHED", "ARCHIVED"] as const),
            },
          })
        ).filter((v) => !!v.publishedAt);
        if (approved.some((v) => v.effectiveOn >= version.effectiveOn))
          this.fail(
            "TIMETABLE_BACKDATED_PUBLICATION",
            "نسخه جدید باید بعد از نسخه‌های تأییدشده اجرا شود؛ از استثنای تاریخ‌دار استفاده کنید.",
            409,
          );
        const data = await this.versionData(manager, version, term, year);
        if (!data.lessons.length)
          this.fail("TIMETABLE_EMPTY", "برنامه خالی قابل انتشار نیست.");
        const conflicts = await this.checkConflicts(
          manager,
          version,
          term,
          year,
          data,
        );
        if (conflicts.length)
          this.fail(
            "TIMETABLE_CONFLICT",
            "تداخل‌ها و تخصیص‌های ناقص را برطرف کنید.",
            409,
            conflicts,
          );
        const previous = await manager.find(TimetableVersion, {
          where: { termId: term.id, state: "PUBLISHED" },
        });
        for (const row of previous) {
          row.state = "ARCHIVED";
          await manager.save(row);
        }
        version.state = "PUBLISHED";
        version.publishedAt = new Date();
        version.revision++;
        version.reason = dto.reason;
        await manager.save(version);
        await this.audit(
          manager,
          user,
          version,
          "version.published",
          previous.map((x) => x.name).join("، "),
          version.name,
          dto.reason,
        );
        return {
          version: this.versionView(version),
          lessons: data.lessons,
          organizationId: year.organizationId,
          reason: dto.reason,
        };
      },
    );
    await this.notifyChange(
      result.organizationId,
      result.lessons,
      `برنامه ${result.version.name} منتشر شد.`,
      result.reason,
      `timetable:${id}:${result.version.revision}`,
    );
    return result.version;
  }
  private async notifyChange(
    organizationId: string,
    lessons: TimetableLesson[],
    title: string,
    body: string,
    key: string,
  ) {
    const classIds = [...new Set(lessons.map((x) => x.classroomId))];
    const enrolled = classIds.length
      ? await this.database.manager.find(EducationClassEnrollment, {
          where: {
            classroom: {
              id: In(classIds),
              organization: { id: organizationId },
            },
            student: {
              accountStatus: "active",
              user: { status: UserStatus.ACTIVE },
            },
          },
          relations: { student: { user: true } },
        })
      : [];
    const ids = [
      ...lessons.map((x) => x.teacherId).filter((x): x is string => !!x),
      ...enrolled
        .map((x) => x.student.user?.id)
        .filter((x): x is string => !!x),
    ];
    // Delivery errors cannot undo a committed timetable; retained change records remain visible.
    await this.notifications
      .createForUsers(ids, {
        type: "info",
        category: "schedule",
        title,
        body,
        url: "/admin/schedule",
        dedupeKey: key,
        organizationId,
      })
      .catch(() => undefined);
  }
  async override(
    user: AuthenticatedUser,
    id: string,
    dto: TimetableOverrideDto,
  ) {
    const result = await attendanceTransaction(
      this.database.manager,
      async (manager) => {
        const { version, term, year } = await this.version(
          user,
          id,
          "schedule.publish",
          manager,
        );
        this.revision(version, dto.expectedRevision, false);
        if (version.state === "DRAFT")
          this.fail(
            "TIMETABLE_STATE",
            "استثنا فقط برای نسخه فعال مجاز است.",
            409,
          );
        const peers = await manager.find(TimetableVersion, {
          where: {
            termId: term.id,
            state: In(["PUBLISHED", "ARCHIVED"] as const),
          },
        });
        const effective = peers
          .filter((v) => !!v.publishedAt && v.effectiveOn <= dto.date)
          .sort(
            (a, b) =>
              b.effectiveOn.localeCompare(a.effectiveOn) ||
              (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
          )[0];
        if (effective?.id !== version.id)
          this.fail(
            "TIMETABLE_SUPERSEDED",
            "نسخه دیگری در این تاریخ اجرا می‌شود.",
            409,
          );
        const data = await this.versionData(manager, version, term, year);
        const lesson = data.lessons.find((x) => x.id === dto.lessonId);
        if (
          !lesson ||
          dto.date < lesson.startsOn ||
          dto.date > lesson.endsOn ||
          weekdayOf(dto.date) !== lesson.weekday
        )
          this.fail("TIMETABLE_OCCURRENCE", "تاریخ متعلق به این درس نیست.");
        if (dto.teacherId)
          await this.teacher(manager, dto.teacherId, year.organizationId);
        if (
          dto.locationId &&
          !(await manager.findOneBy(TimetableLocation, {
            id: dto.locationId,
            organizationId: year.organizationId,
          }))
        )
          this.fail("TIMETABLE_LOCATION_SCOPE", "اتاق در این مدرسه پیدا نشد.");
        this.times(
          dto.startTime ?? lesson.startTime,
          dto.endTime ?? lesson.endTime,
        );
        const previous = await manager.findOneBy(TimetableOverride, {
          lessonId: lesson.id,
          date: dto.date,
        });
        const change = manager.create(TimetableOverride, {
          ...(previous ?? {}),
          versionId: id,
          lessonId: lesson.id,
          date: dto.date,
          cancelled: dto.cancelled,
          teacherId: dto.teacherId ?? null,
          locationId: dto.locationId ?? null,
          startTime: dto.startTime ?? null,
          endTime: dto.endTime ?? null,
          reason: dto.reason,
          changedById: user.id,
          changedByName: this.name(user),
        });
        data.overrides = [
          ...data.overrides.filter(
            (x) => !(x.lessonId === lesson.id && x.date === dto.date),
          ),
          {
            ...change,
            id: previous?.id ?? "preview",
            createdAt: new Date().toISOString(),
          },
        ];
        const conflicts = (
          await this.checkConflicts(manager, version, term, year, data)
        ).filter((x) => x.lessonIds.includes(lesson.id) && x.date === dto.date);
        if (conflicts.length)
          this.fail(
            "TIMETABLE_CONFLICT",
            "استثنا تداخل ایجاد می‌کند.",
            409,
            conflicts,
          );
        const row = await manager.save(change);
        const linked = await manager.findOneBy(TimetableOccurrence, {
          lessonId: lesson.id,
          date: dto.date,
        });
        if (linked?.attendanceSessionId) {
          const effectiveOccurrence = occurrencesForRange(
            [lesson],
            data.overrides,
            data.holidays,
            dto.date,
            dto.date,
            year.timeZone,
          )[0];
          await this.attendance.applyTimetableChange(
            manager,
            linked.attendanceSessionId,
            lesson.id,
            {
              cancelled: effectiveOccurrence.cancelled,
              teacherId: effectiveOccurrence.teacherId ?? null,
              startsAt: effectiveOccurrence.startsAt,
              endsAt: effectiveOccurrence.endsAt,
              reason: dto.reason,
            },
            user,
          );
        }
        version.revision++;
        await manager.save(version);
        await this.audit(
          manager,
          user,
          version,
          dto.cancelled ? "lesson.cancelled" : "lesson.substituted",
          `${lesson.title} ${lesson.startTime}-${lesson.endTime}`,
          dto.cancelled
            ? "لغو"
            : `${dto.startTime ?? lesson.startTime}-${dto.endTime ?? lesson.endTime}`,
          `${dto.date}: ${dto.reason}`,
          lesson.id,
        );
        return {
          change: { ...row, createdAt: row.createdAt.toISOString() },
          lesson,
          organizationId: year.organizationId,
          revision: version.revision,
        };
      },
    );
    await this.notifyChange(
      result.organizationId,
      [
        result.lesson,
        ...(dto.teacherId
          ? [{ ...result.lesson, teacherId: dto.teacherId }]
          : []),
      ],
      "تغییر برنامه درسی",
      `${dto.date}: ${result.lesson.title}؛ ${dto.cancelled ? "لغو درس" : `${dto.startTime ?? result.lesson.startTime} تا ${dto.endTime ?? result.lesson.endTime}`}؛ ${dto.reason}؛ ${this.name(user)}`,
      `timetable-override:${result.change.id}:${result.revision}`,
    );
    return result.change;
  }
  async config(
    user: AuthenticatedUser,
    organizationId: string,
    dto: TimetableConfigDto,
  ) {
    await this.school(user, organizationId, "schedule.update");
    return attendanceTransaction(this.database.manager, async (manager) => {
      const name = () => {
        if (!dto.name?.trim()) this.fail("TIMETABLE_REQUIRED", "نام لازم است.");
        return dto.name.trim();
      };
      const interval = () => {
        if (!dto.startsOn || !dto.endsOn)
          this.fail("TIMETABLE_REQUIRED", "بازه تاریخ لازم است.");
        this.dates(dto.startsOn, dto.endsOn);
        return { startsOn: dto.startsOn, endsOn: dto.endsOn };
      };
      const times = () => {
        if (!dto.startTime || !dto.endTime)
          this.fail("TIMETABLE_REQUIRED", "ساعت شروع و پایان لازم است.");
        this.times(dto.startTime, dto.endTime);
        return { startTime: dto.startTime, endTime: dto.endTime };
      };
      if (dto.kind === "year") {
        const dates = interval();
        const timeZone = dto.timeZone ?? "Asia/Tehran";
        try {
          new Intl.DateTimeFormat("en", { timeZone }).format(new Date());
        } catch {
          this.fail("TIMETABLE_TIMEZONE", "منطقه زمانی IANA معتبر لازم است.");
        }
        if (dto.id) {
          const existing = await manager.findOneBy(TimetableAcademicYear, {
            id: dto.id,
            organizationId,
          });
          if (!existing) this.fail("TIMETABLE_NOT_FOUND", "سال پیدا نشد.", 404);
          if (
            existing.startsOn !== dates.startsOn ||
            existing.endsOn !== dates.endsOn ||
            existing.timeZone !== timeZone
          )
            this.fail(
              "TIMETABLE_IMMUTABLE",
              "سال دارای برنامه را تغییر ندهید؛ سال جدید بسازید.",
              409,
            );
          if (dto.active)
            await manager.update(
              TimetableAcademicYear,
              { organizationId },
              { active: false },
            );
          existing.active = !!dto.active;
          return manager.save(existing);
        }
        if (dto.active)
          await manager.update(
            TimetableAcademicYear,
            { organizationId },
            { active: false },
          );
        return manager.save(
          TimetableAcademicYear,
          manager.create(TimetableAcademicYear, {
            organizationId,
            name: name(),
            ...dates,
            timeZone,
            active: !!dto.active,
          }),
        );
      }
      if (dto.id)
        this.fail(
          "TIMETABLE_CONFIG_IMMUTABLE",
          "پیکربندی ثبت‌شده برای حفظ تاریخچه قابل بازنویسی نیست.",
          409,
        );
      if (dto.kind === "section")
        return manager.save(
          TimetableSection,
          manager.create(TimetableSection, { organizationId, name: name() }),
        );
      if (dto.kind === "location")
        return manager.save(
          TimetableLocation,
          manager.create(TimetableLocation, {
            organizationId,
            name: name(),
            capacity: dto.number ?? 35,
          }),
        );
      if (dto.kind === "classSection") {
        const classroom = await manager.findOne(EducationClass, {
          where: { id: dto.classroomId, organization: { id: organizationId } },
        });
        const section =
          dto.sectionId &&
          (await manager.findOneBy(TimetableSection, {
            id: dto.sectionId,
            organizationId,
          }));
        if (!classroom || !section)
          this.fail("TIMETABLE_SCOPE", "کلاس و بخش معتبر لازم است.");
        if (
          classroom.timetableSectionId !== section.id &&
          (await manager
            .getRepository(SchoolScheduleEntry)
            .createQueryBuilder("lesson")
            .innerJoin("lesson.version", "version")
            .where(
              "lesson.classroomId = :id AND version.publishedAt IS NOT NULL",
              { id: classroom.id },
            )
            .getExists())
        )
          this.fail(
            "TIMETABLE_SECTION_IMMUTABLE",
            "بخش کلاس دارای برنامه تأییدشده قابل بازنویسی نیست.",
            409,
          );
        classroom.timetableSectionId = section.id;
        return manager.save(classroom);
      }
      if (
        ["term", "session", "period", "holiday"].includes(dto.kind) &&
        !dto.parentId
      )
        this.fail("TIMETABLE_REQUIRED", "انتخاب پیکربندی والد لازم است.");
      if (dto.kind === "term") {
        const year = await manager.findOneBy(TimetableAcademicYear, {
          id: dto.parentId,
          organizationId,
        });
        const dates = interval();
        if (
          !year ||
          dates.startsOn < year.startsOn ||
          dates.endsOn > year.endsOn
        )
          this.fail("TIMETABLE_DATE_RANGE", "نیم‌سال باید در سال تحصیلی باشد.");
        return manager.save(
          TimetableTerm,
          manager.create(TimetableTerm, {
            yearId: year.id,
            name: name(),
            ...dates,
          }),
        );
      }
      if (dto.kind === "bell") {
        if (
          dto.sectionId &&
          !(await manager.findOneBy(TimetableSection, {
            id: dto.sectionId,
            organizationId,
          }))
        )
          this.fail("TIMETABLE_SCOPE", "بخش مدرسه پیدا نشد.");
        return manager.save(
          TimetableBellSchedule,
          manager.create(TimetableBellSchedule, {
            organizationId,
            sectionId: dto.sectionId ?? null,
            name: name(),
          }),
        );
      }
      if (dto.kind === "session") {
        const bell = await manager.findOneBy(TimetableBellSchedule, {
          id: dto.parentId,
          organizationId,
        });
        if (!bell) this.fail("TIMETABLE_SCOPE", "برنامه زنگ پیدا نشد.");
        return manager.save(
          TimetableDailySession,
          manager.create(TimetableDailySession, {
            bellId: bell.id,
            name: name(),
            kind: dto.sessionKind ?? "MORNING",
            ...times(),
          }),
        );
      }
      if (dto.kind === "period") {
        const session = await manager.findOneBy(TimetableDailySession, {
          id: dto.parentId,
        });
        const bell =
          session &&
          (await manager.findOneBy(TimetableBellSchedule, {
            id: session.bellId,
            organizationId,
          }));
        const clock = times();
        if (
          !session ||
          !bell ||
          clock.startTime < session.startTime ||
          clock.endTime > session.endTime
        )
          this.fail("TIMETABLE_TIME_RANGE", "زنگ باید در ساعت نوبت باشد.");
        return manager.save(
          TimetablePeriod,
          manager.create(TimetablePeriod, {
            sessionId: session.id,
            name: name(),
            weekdays: dto.weekdays ?? [],
            ordinal: dto.number ?? 1,
            ...clock,
          }),
        );
      }
      if (dto.kind === "holiday") {
        if (!dto.parentId || !dto.date)
          this.fail("TIMETABLE_REQUIRED", "نیم‌سال و تاریخ لازم است.");
        const { term, year } = await this.term(manager, dto.parentId);
        if (
          year.organizationId !== organizationId ||
          dto.date < term.startsOn ||
          dto.date > term.endsOn
        )
          this.fail("TIMETABLE_SCOPE", "تعطیلی خارج از نیم‌سال است.");
        if (
          await manager.exists(TimetableVersion, {
            where: { termId: term.id, publishedAt: Not(IsNull()) },
          })
        )
          this.fail(
            "TIMETABLE_CALENDAR_FROZEN",
            "برای نسخه تأییدشده از لغو تاریخ‌دار درس استفاده کنید؛ تقویم تاریخی تغییر نمی‌کند.",
            409,
          );
        return manager.save(
          TimetableHoliday,
          manager.create(TimetableHoliday, {
            termId: term.id,
            date: dto.date,
            name: name(),
          }),
        );
      }
      if (dto.kind === "availability") {
        if (!dto.teacherId || dto.weekday === undefined)
          this.fail("TIMETABLE_REQUIRED", "استاد و روز لازم است.");
        await this.teacher(manager, dto.teacherId, organizationId);
        const row = manager.create(TimetableTeacherAvailability, {
          organizationId,
          teacherId: dto.teacherId,
          weekday: dto.weekday,
          ...interval(),
          ...times(),
          reason: dto.reason ?? "",
        });
        const years = await manager.find(TimetableAcademicYear, {
          where: { organizationId },
        });
        const terms = years.length
          ? await manager.find(TimetableTerm, {
              where: { yearId: In(years.map((x) => x.id)) },
            })
          : [];
        const published = terms.length
          ? await manager.find(TimetableVersion, {
              where: {
                termId: In(terms.map((x) => x.id)),
                state: In(["PUBLISHED", "ARCHIVED"] as const),
                publishedAt: Not(IsNull()),
              },
            })
          : [];
        for (const version of published) {
          const { term, year } = await this.term(manager, version.termId);
          const data = await this.versionData(manager, version, term, year);
          const successor = published
            .filter(
              (v) =>
                v.termId === version.termId &&
                (v.effectiveOn > version.effectiveOn ||
                  (v.effectiveOn === version.effectiveOn &&
                    v.publishedAt!.getTime() > version.publishedAt!.getTime())),
            )
            .sort((a, b) => a.effectiveOn.localeCompare(b.effectiveOn))[0];
          if (successor) {
            data.endsOn = addDays(successor.effectiveOn, -1);
            data.lessons = data.lessons
              .filter((l) => l.startsOn <= data.endsOn)
              .map((l) => ({
                ...l,
                endsOn: l.endsOn > data.endsOn ? data.endsOn : l.endsOn,
              }));
          }
          if (data.endsOn < data.startsOn) continue;
          data.availability.push(row);
          const conflicts = await this.checkConflicts(
            manager,
            version,
            term,
            year,
            data,
          );
          if (conflicts.some((x) => x.code === "TEACHER_UNAVAILABLE"))
            this.fail(
              "TIMETABLE_CONFLICT",
              "ابتدا برای درس‌های منتشرشده استاد جایگزین تعیین کنید.",
              409,
              conflicts,
            );
        }
        return manager.save(row);
      }
      if (dto.kind === "allocation") {
        if (
          !dto.parentId ||
          !dto.classroomId ||
          !dto.classBookId ||
          dto.expectedRevision === undefined
        )
          this.fail("TIMETABLE_REQUIRED", "نسخه و کتاب کلاس لازم است.");
        const { version, year } = await this.version(
          user,
          dto.parentId,
          "schedule.update",
          manager,
        );
        if (year.organizationId !== organizationId)
          this.fail("TIMETABLE_SCOPE", "نسخه خارج از مدرسه است.");
        this.revision(version, dto.expectedRevision);
        const book = await manager.findOne(EducationClassBook, {
          where: {
            id: dto.classBookId,
            classroom: {
              id: dto.classroomId,
              organization: { id: organizationId },
            },
          },
        });
        if (!book) this.fail("TIMETABLE_SCOPE", "کتاب کلاس پیدا نشد.");
        const old = await manager.findOneBy(TimetableAllocation, {
          versionId: version.id,
          classBookId: book.id,
        });
        const row = await manager.save(
          TimetableAllocation,
          manager.create(TimetableAllocation, {
            ...(old ?? {}),
            versionId: version.id,
            classroomId: dto.classroomId,
            classBookId: book.id,
            lessonsPerWeek: dto.number ?? 1,
          }),
        );
        version.revision++;
        await manager.save(version);
        await this.audit(
          manager,
          user,
          version,
          "allocation.updated",
          String(old?.lessonsPerWeek ?? 0),
          String(row.lessonsPerWeek),
          "تخصیص هفتگی کتاب",
        );
        return row;
      }
      this.fail("TIMETABLE_CONFIG_KIND", "نوع پیکربندی معتبر نیست.");
    });
  }
  private async previewRows(
    manager: EntityManager,
    user: AuthenticatedUser,
    id: string,
    dto: TimetableImportDto,
  ) {
    const { version, term, year } = await this.version(
      user,
      id,
      "schedule.import",
      manager,
    );
    this.revision(version, dto.expectedRevision);
    const rows: Array<{ row: number; source: string; errors: string[] }> = [];
    const data = await this.versionData(manager, version, term, year);
    for (let index = 0; index < dto.rows.length; index++) {
      const item = dto.rows[index];
      const errors: string[] = [];
      try {
        const checked = await this.validateLesson(
          manager,
          item.lesson,
          version,
          term,
          year,
        );
        data.lessons.push({
          ...item.lesson,
          id: `import:${index}`,
          versionId: id,
          title: checked.book.book.titleFa,
          classroomName: checked.classroom.name,
          teacherName: checked.teacher ? this.person(checked.teacher) : "",
          locationName: checked.location?.name ?? "",
          sectionId: checked.classroom.timetableSectionId,
          gradeId: checked.classroom.gradeId,
          periodName: "",
          sessionKind: "OTHER",
        });
      } catch (error) {
        errors.push(
          error instanceof ApiException
            ? (error.getResponse() as { error: { message: string } }).error
                .message
            : "ردیف نامعتبر است.",
        );
      }
      rows.push({ row: index + 1, source: item.source, errors });
    }
    // Weekly completeness is checked when publishing, after all import batches.
    const conflicts = (
      await this.checkConflicts(manager, version, term, year, data)
    ).filter((x) => x.code !== "INCOMPLETE_ALLOCATION");
    return {
      valid: rows.every((row) => !row.errors.length) && !conflicts.length,
      revision: version.revision,
      rows,
      conflicts,
    };
  }
  async previewImport(
    user: AuthenticatedUser,
    id: string,
    dto: TimetableImportDto,
  ) {
    return this.previewRows(this.database.manager, user, id, dto);
  }
  private importFingerprint(dto: TimetableImportDto) {
    const rows = dto.rows
      .map(({ source, lesson }) => ({
        source,
        classroomId: lesson.classroomId,
        classBookId: lesson.classBookId,
        teacherId: lesson.teacherId ?? null,
        periodId: lesson.periodId,
        locationId: lesson.locationId ?? null,
        weekday: lesson.weekday,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        startsOn: lesson.startsOn,
        endsOn: lesson.endsOn,
        notes: lesson.notes ?? "",
      }))
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      );
    return createHash("sha256")
      .update(JSON.stringify({ sheetName: dto.sheetName, rows }))
      .digest("hex");
  }
  async commitImport(
    user: AuthenticatedUser,
    id: string,
    dto: TimetableImportDto,
  ) {
    return attendanceTransaction(this.database.manager, async (manager) => {
      const fingerprint = this.importFingerprint(dto);
      const existing = await manager.findOneBy(TimetableImport, {
        versionId: id,
        fingerprint,
      });
      if (existing) {
        const { version } = await this.version(
          user,
          id,
          "schedule.import",
          manager,
        );
        return { imported: 0, revision: version.revision, duplicate: true };
      }
      const preview = await this.previewRows(manager, user, id, dto);
      if (!preview.valid)
        this.fail(
          "TIMETABLE_IMPORT_INVALID",
          "خطاهای نگاشت و تداخل را برطرف کنید.",
          422,
          preview,
        );
      const { version, term, year } = await this.version(
        user,
        id,
        "schedule.import",
        manager,
      );
      for (const row of dto.rows)
        await this.saveLesson(manager, user, version, term, year, row.lesson);
      version.revision++;
      await manager.save(version);
      await manager.save(
        TimetableImport,
        manager.create(TimetableImport, {
          versionId: id,
          actorId: user.id,
          filename: dto.filename,
          sheetName: dto.sheetName,
          fingerprint,
          sourceRows: dto.rows.map(({ source, provenance }) => ({
            source,
            provenance,
          })),
          rowCount: dto.rows.length,
          revision: version.revision,
        }),
      );
      await this.audit(
        manager,
        user,
        version,
        "import.committed",
        "",
        `${dto.rows.length} ردیف`,
        `${dto.filename} / ${dto.sheetName}`,
      );
      return {
        imported: dto.rows.length,
        revision: version.revision,
        duplicate: false,
      };
    });
  }
  async openAttendance(user: AuthenticatedUser, id: string, date: string) {
    this.capability(user, "attendance.class.manage");
    return attendanceTransaction(this.database.manager, async (manager) => {
      const row = await manager.findOne(SchoolScheduleEntry, {
        where: { id, status: "ACTIVE" },
        relations: { classroom: true, classBook: { book: true } },
      });
      if (!row?.versionId)
        this.fail("TIMETABLE_NOT_FOUND", "درس منتشرشده پیدا نشد.", 404);
      const { version, term, year } = await this.version(
        user,
        row.versionId,
        "schedule.read",
        manager,
      );
      if (!version.publishedAt)
        this.fail("TIMETABLE_STATE", "حضور برای پیش‌نویس مجاز نیست.");
      const data = await this.versionData(manager, version, term, year);
      const occurrence = occurrencesForRange(
        data.lessons,
        data.overrides,
        data.holidays,
        date,
        date,
        year.timeZone,
      ).find((x) => x.id === id);
      if (!occurrence)
        this.fail("TIMETABLE_OCCURRENCE", "درس در این تاریخ برگزار نمی‌شود.");
      // Reuse the attendance service's resource policy even for an already-created occurrence.
      if (
        !user.capabilities?.includes("schedule.read.all") &&
        user.id !== occurrence.teacherId
      )
        this.fail(
          "FORBIDDEN",
          "فقط استاد این وقوع درس می‌تواند حضور را باز کند.",
          403,
        );
      const old = await manager.findOneBy(TimetableOccurrence, {
        lessonId: id,
        date,
      });
      if (old?.attendanceSessionId)
        return {
          sessionId: old.attendanceSessionId,
          cancelled: occurrence.cancelled,
        };
      const successors = await manager.find(TimetableVersion, {
        where: {
          termId: term.id,
          state: In(["PUBLISHED", "ARCHIVED"] as const),
        },
      });
      if (
        successors.some(
          (v) =>
            v.id !== version.id &&
            !!v.publishedAt &&
            v.effectiveOn <= date &&
            (v.effectiveOn > version.effectiveOn ||
              (v.effectiveOn === version.effectiveOn &&
                v.publishedAt!.getTime() > version.publishedAt!.getTime())),
        )
      )
        this.fail(
          "TIMETABLE_SUPERSEDED",
          "نسخه دیگری در این تاریخ اجرا می‌شود.",
          409,
        );
      if (occurrence.cancelled)
        this.fail(
          "TIMETABLE_CANCELLED",
          "این درس لغو شده است؛ تاریخچه حضور حذف نشده است.",
          409,
        );
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: year.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      if (date !== today)
        this.fail(
          "TIMETABLE_ATTENDANCE_DATE",
          "حضور را در روز برگزاری درس ثبت کنید.",
        );
      const session = await this.attendance.createTimetableSession(user, {
        organizationId: year.organizationId,
        classroomId: row.classroom!.id,
        lessonId: id,
        date,
        title: `${row.classroomNameSnapshot} · ${row.title}`,
        subjectId: row.classBook?.book?.id ?? null,
        subjectName: row.classBook?.book?.titleFa ?? null,
        academicYearId: year.id,
        academicYearName: year.name,
        termId: term.id,
        termName: term.name,
        startsAt: occurrence.startsAt,
        endsAt: occurrence.endsAt,
        timeZone: year.timeZone,
        teacherId: occurrence.teacherId ?? null,
      });
      await manager.save(
        TimetableOccurrence,
        manager.create(TimetableOccurrence, {
          lessonId: id,
          date,
          attendanceSessionId: session.id,
        }),
      );
      return { sessionId: session.id, cancelled: false };
    });
  }
}
