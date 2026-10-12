import { User, UserStatus } from "../../database/entities/user.entity";
import { OrganizationMembership, MembershipStatus } from "../../database/entities/organization-membership.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { randomUUID } from "node:crypto";
import type {
  TimetableLesson,
  TimetableWorkspace,
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
} from "../../database/entities/timetable.entity";
import { SchoolScheduleEntry } from "../../database/entities/school-schedule-entry.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassBook } from "../../database/entities/education-class-book.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { AttendanceService, attendanceTransaction } from "../attendance";
import { NotificationsService } from "../notifications";
import {
  TimetableConfigDto,
  TimetableLessonDto,
  TimetableLessonWriteDto,
  TimetableVersionDto,
  TimetablePublishDto,
  TimetableOverrideDto,
  TimetableImportDto,
} from "./timetable.dto";
import {
  canonicalDate,
  addDays,
  weekdayOf,
  minuteOf,
  occurrencesForRange,
  detectTimetableConflicts,
} from "./timetable-domain";

@Injectable()
export class TimetableService {
  constructor(
    private readonly database: DataSource,
    private readonly access: SchoolAccessService,
    private readonly attendance: AttendanceService,
    private readonly notifications: NotificationsService,
  ) {}
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
  private async validateLesson(
    manager: EntityManager,
    dto: TimetableLessonDto,
    version: TimetableVersion,
    term: TimetableTerm,
    year: TimetableAcademicYear,
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
    const classroom = await manager.findOne(EducationClass, {
      where: {
        id: dto.classroomId,
        organization: { id: year.organizationId },
        status: "ACTIVE",
      },
      relations: { organization: true },
    });
    const book = await manager.findOne(EducationClassBook, {
      where: { id: dto.classBookId, classroom: { id: dto.classroomId } },
      relations: { book: true, teacher: true },
    });
    const period = await manager.findOneBy(TimetablePeriod, {
      id: dto.periodId,
    });
    const session =
      period &&
      (await manager.findOneBy(TimetableDailySession, {
        id: period.sessionId,
      }));
    const bell =
      session &&
      (await manager.findOneBy(TimetableBellSchedule, { id: session.bellId }));
    if (
      !classroom ||
      !book ||
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
      ? await this.teacher(manager, dto.teacherId, year.organizationId)
      : null;
    const location = dto.locationId
      ? await manager.findOneBy(TimetableLocation, {
          id: dto.locationId,
          organizationId: year.organizationId,
        })
      : null;
    if (dto.locationId && !location)
      this.fail("TIMETABLE_LOCATION_SCOPE", "اتاق در این مدرسه پیدا نشد.");
    return { classroom, book, teacher, location };
  }
  private async lessonViews(
    manager: EntityManager,
    versionId: string,
  ): Promise<TimetableLesson[]> {
    const rows = await manager.find(SchoolScheduleEntry, {
      where: { versionId, status: "ACTIVE" },
      relations: { classroom: true, classBook: { book: true }, teacher: true },
      order: { weekday: "ASC", startTime: "ASC" },
    });
    const periods = await manager.find(TimetablePeriod);
    const sessions = await manager.find(TimetableDailySession);
    const locations = await manager.find(TimetableLocation);
    return rows.map((row) => ({
      id: row.id,
      versionId,
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
      periodName: periods.find((x) => x.id === row.periodId)?.name ?? "",
      sessionKind:
        sessions.find(
          (x) => x.id === periods.find((p) => p.id === row.periodId)?.sessionId,
        )?.kind ?? "OTHER",
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
    return {
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
  async workspace(
    user: AuthenticatedUser,
    organizationId: string,
    versionId?: string,
    startsOn?: string,
  ): Promise<TimetableWorkspace> {
    await this.school(user, organizationId);
    const manager = this.database.manager;
    const years = await manager.find(TimetableAcademicYear, {
      where: { organizationId },
      order: { startsOn: "DESC" },
    });
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
    const selected = versionId
      ? versions.find((x) => x.id === versionId)
      : [...versions]
          .filter(
            (x) =>
              x.state !== "DRAFT" &&
              years.find(
                (y) => y.id === terms.find((t) => t.id === x.termId)?.yearId,
              )?.active &&
              x.effectiveOn <= addDays(feedDate, 6) &&
              terms.find((t) => t.id === x.termId)!.endsOn >= feedDate,
          )
          .sort(
            (a, b) =>
              b.effectiveOn.localeCompare(a.effectiveOn) ||
              b.publishedAt!.getTime() - a.publishedAt!.getTime(),
          )[0];
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
          years.find(
            (y) => y.id === terms.find((t) => t.id === v.termId)?.yearId,
          )?.active &&
          v.effectiveOn <= addDays(startsOn, 6) &&
          terms.find((t) => t.id === v.termId)!.endsOn >= startsOn,
      );
      const feedLessons: TimetableLesson[] = [];
      const feedOverrides: OverrideContract[] = [];
      const feedHolidays: typeof data.holidays = [];
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
        feedHolidays.push(...snapshot.holidays);
      }
      data = {
        ...data,
        lessons: feedLessons,
        overrides: feedOverrides,
        holidays: [...new Map(feedHolidays.map((x) => [x.id, x])).values()],
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
      for (const enrollment of enrollments) studentClasses.add(enrollment.classroom.id);
    }
    const ownTeachingLesson = (lesson: TimetableLesson) => teaching && (
      lesson.teacherId === user.id ||
      data?.overrides.some((change) => change.lessonId === lesson.id && change.teacherId === user.id)
    );
    const lessons = (data?.lessons ?? []).filter(
      (lesson) => full || studentClasses.has(lesson.classroomId) || ownTeachingLesson(lesson),
    );
    const allowedClasses = new Set(lessons.map((lesson) => lesson.classroomId));
    for (const id of studentClasses) allowedClasses.add(id);
    const overrides = (data?.overrides ?? []).filter((x) =>
      lessons.some((l) => l.id === x.lessonId),
    );
    let occurrences: TimetableWorkspace["occurrences"] = [];
    if (data && startsOn) {
      this.dates(startsOn, addDays(startsOn, 6));
      occurrences = occurrencesForRange(
        lessons,
        overrides,
        data.holidays,
        startsOn,
        addDays(startsOn, 6),
        data.timeZone,
      );
      const linked = lessons.length
        ? await manager.find(TimetableOccurrence, {
            where: { lessonId: In(lessons.map((x) => x.id)) },
          })
        : [];
      if (!full)
        occurrences = occurrences.filter(
          (occurrence) => studentClasses.has(occurrence.classroomId) ||
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
      versions: versions.map((x) => this.versionView(x)),
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
      conflicts: full && data ? detectTimetableConflicts(data) : [],
      occurrences,
    };
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
      canonicalDate(dto.effectiveOn);
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
  ) {
    const context = await this.validateLesson(
      manager,
      dto,
      version,
      term,
      year,
    );
    const existing = id
      ? await manager.findOneBy(SchoolScheduleEntry, {
          id,
          versionId: version.id,
        })
      : null;
    if (id && !existing) this.fail("TIMETABLE_NOT_FOUND", "درس پیدا نشد.", 404);
    if (
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
      const conflicts = detectTimetableConflicts(data).filter(
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
        const data = await this.versionData(manager, version, term, year);
        if (!data.lessons.length)
          this.fail("TIMETABLE_EMPTY", "برنامه خالی قابل انتشار نیست.");
        const conflicts = detectTimetableConflicts(data);
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
        if (version.state !== "PUBLISHED")
          this.fail(
            "TIMETABLE_STATE",
            "استثنا فقط برای نسخه فعال مجاز است.",
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
        const conflicts = detectTimetableConflicts(data).filter(
          (x) => x.lessonIds.includes(lesson.id) && x.date === dto.date,
        );
        if (conflicts.length)
          this.fail(
            "TIMETABLE_CONFLICT",
            "استثنا تداخل ایجاد می‌کند.",
            409,
            conflicts,
          );
        const row = await manager.save(change);
        if (dto.teacherId && !dto.cancelled) {
          const linked = await manager.findOneBy(TimetableOccurrence, {
            lessonId: lesson.id,
            date: dto.date,
          });
          if (linked?.attendanceSessionId)
            await this.attendance.reassignTimetableSession(
              linked.attendanceSessionId,
              lesson.id,
              dto.teacherId,
            );
        }
        if (dto.cancelled) {
          const linked = await manager.findOneBy(TimetableOccurrence, {
            lessonId: lesson.id,
            date: dto.date,
          });
          if (linked?.attendanceSessionId)
            await this.attendance.cancelTimetableSession(
              linked.attendanceSessionId,
              lesson.id,
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
      [result.lesson],
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
              where: { termId: In(terms.map((x) => x.id)), state: "PUBLISHED" },
            })
          : [];
        for (const version of published) {
          const { term, year } = await this.term(manager, version.termId);
          const data = await this.versionData(manager, version, term, year);
          data.availability.push(row);
          const conflicts = detectTimetableConflicts(data);
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
          error instanceof ApiException ? (error.getResponse() as {error: {message: string}}).error.message : "ردیف نامعتبر است.",
        );
      }
      rows.push({ row: index + 1, source: item.source, errors });
    }
    // Weekly completeness is checked when publishing, after all import batches.
    const conflicts = detectTimetableConflicts(data).filter(x => x.code !== "INCOMPLETE_ALLOCATION");
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
  async commitImport(
    user: AuthenticatedUser,
    id: string,
    dto: TimetableImportDto,
  ) {
    return attendanceTransaction(this.database.manager, async (manager) => {
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
      return { imported: dto.rows.length, revision: version.revision };
    });
  }
  async openAttendance(user: AuthenticatedUser, id: string, date: string) {
    this.capability(user, "attendance.class.manage");
    return attendanceTransaction(this.database.manager, async (manager) => {
      const row = await manager.findOne(SchoolScheduleEntry, {
        where: { id, status: "ACTIVE" },
        relations: { classroom: true },
      });
      if (!row?.versionId)
        this.fail("TIMETABLE_NOT_FOUND", "درس منتشرشده پیدا نشد.", 404);
      const { version, term, year } = await this.version(
        user,
        row.versionId,
        "schedule.read",
        manager,
      );
      if (version.state === "DRAFT")
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
