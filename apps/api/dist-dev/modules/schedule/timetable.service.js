"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableService = void 0;
const user_entity_1 = require("../../database/entities/user.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const node_crypto_1 = require("node:crypto");
const api_exception_1 = require("../../common/exceptions/api.exception");
const entities_1 = require("../../database/entities");
const school_access_1 = require("../school-access");
const attendance_1 = require("../attendance");
const notifications_1 = require("../notifications");
const timetable_domain_1 = require("./timetable-domain");
let TimetableService = class TimetableService {
    database;
    access;
    attendance;
    notifications;
    constructor(database, access, attendance, notifications) {
        this.database = database;
        this.access = access;
        this.attendance = attendance;
        this.notifications = notifications;
    }
    fail(code, message, status = 422, details) {
        throw new api_exception_1.ApiException(status, code, message, details);
    }
    capability(user, code) {
        if (!user.capabilities?.includes(code))
            this.fail("FORBIDDEN", "دسترسی کافی ندارید.", 403);
    }
    async school(user, id, capability = "schedule.read") {
        this.capability(user, capability);
        if (user.activeOrganizationId && user.activeOrganizationId !== id)
            this.fail("ORGANIZATION_FORBIDDEN", "مدرسه با زمینه کاری فعال یکسان نیست.", 403);
        await this.access.organizationForUser(user, id);
        return id;
    }
    name(user) {
        return user.username || "کاربر";
    }
    person(user) {
        return ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.username);
    }
    dates(start, end) {
        try {
            (0, timetable_domain_1.canonicalDate)(start);
            (0, timetable_domain_1.canonicalDate)(end);
            if (end < start || Date.parse(end) - Date.parse(start) > 730 * 86400000)
                throw Error();
        }
        catch {
            this.fail("TIMETABLE_DATE_RANGE", "بازه تاریخ معتبر تا دو سال انتخاب کنید.");
        }
    }
    times(start, end) {
        try {
            if ((0, timetable_domain_1.minuteOf)(end) <= (0, timetable_domain_1.minuteOf)(start))
                throw Error();
        }
        catch {
            this.fail("TIMETABLE_TIME_RANGE", "زمان پایان باید بعد از شروع باشد.");
        }
    }
    async term(manager, id) {
        const term = await manager.findOneBy(entities_1.TimetableTerm, { id });
        const year = term &&
            (await manager.findOneBy(entities_1.TimetableAcademicYear, { id: term.yearId }));
        if (!term || !year)
            this.fail("TIMETABLE_NOT_FOUND", "نیم‌سال پیدا نشد.", 404);
        return { term, year };
    }
    async version(user, id, capability, manager = this.database.manager) {
        const version = await manager.findOneBy(entities_1.TimetableVersion, { id });
        if (!version)
            this.fail("TIMETABLE_NOT_FOUND", "نسخه برنامه پیدا نشد.", 404);
        const { term, year } = await this.term(manager, version.termId);
        await this.school(user, year.organizationId, capability);
        return { version, term, year };
    }
    revision(version, expected, draft = true) {
        if (draft && version.state !== "DRAFT")
            this.fail("TIMETABLE_IMMUTABLE", "نسخه منتشرشده را در پیش‌نویس جدید تغییر دهید.", 409);
        if (version.revision !== expected)
            this.fail("TIMETABLE_STALE", "برنامه تغییر کرده است؛ دوباره بارگذاری کنید.", 409);
    }
    async audit(manager, user, version, action, beforeText, afterText, reason, lessonId = null) {
        await manager.save(entities_1.TimetableChange, manager.create(entities_1.TimetableChange, {
            versionId: version.id,
            lessonId,
            action,
            beforeText,
            afterText,
            reason,
            actorId: user.id,
            actorName: this.name(user),
        }));
    }
    versionView(row) {
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
    async teacher(manager, id, organizationId) {
        const membership = await manager.findOne(entities_1.OrganizationMembership, {
            where: {
                user: { id, status: user_entity_1.UserStatus.ACTIVE },
                organization: { id: organizationId },
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            },
            relations: { user: true },
        });
        const roles = membership &&
            (await manager.find(entities_1.UserRoleAssignment, {
                where: { user: { id }, membership: { id: membership.id } },
                relations: { role: true },
            }));
        if (!membership || !roles?.some((row) => row.role.code === "TEACHER"))
            this.fail("TIMETABLE_TEACHER_SCOPE", "استاد باید حساب فعال تدریس در این مدرسه داشته باشد.");
        return membership.user;
    }
    async validateLesson(manager, dto, version, term, year) {
        this.dates(dto.startsOn, dto.endsOn);
        this.times(dto.startTime, dto.endTime);
        if (dto.startsOn < term.startsOn ||
            dto.endsOn > term.endsOn ||
            dto.startsOn < version.effectiveOn)
            this.fail("TIMETABLE_LESSON_DATES", "تاریخ درس باید در بازه نیم‌سال و نسخه باشد.");
        const classroom = await manager.findOne(entities_1.EducationClass, {
            where: {
                id: dto.classroomId,
                organization: { id: year.organizationId },
                status: "ACTIVE",
            },
            relations: { organization: true },
        });
        const book = await manager.findOne(entities_1.EducationClassBook, {
            where: { id: dto.classBookId, classroom: { id: dto.classroomId } },
            relations: { book: true, teacher: true },
        });
        const period = await manager.findOneBy(entities_1.TimetablePeriod, {
            id: dto.periodId,
        });
        const session = period &&
            (await manager.findOneBy(entities_1.TimetableDailySession, {
                id: period.sessionId,
            }));
        const bell = session &&
            (await manager.findOneBy(entities_1.TimetableBellSchedule, { id: session.bellId }));
        if (!classroom ||
            !book ||
            !bell ||
            bell.organizationId !== year.organizationId)
            this.fail("TIMETABLE_LESSON_SCOPE", "کلاس، کتاب و زنگ باید متعلق به همین مدرسه باشند.");
        if (bell.sectionId && bell.sectionId !== classroom.timetableSectionId)
            this.fail("TIMETABLE_SECTION_MISMATCH", "زنگ انتخاب‌شده متعلق به بخش کلاس نیست.");
        const teacher = dto.teacherId
            ? await this.teacher(manager, dto.teacherId, year.organizationId)
            : null;
        const location = dto.locationId
            ? await manager.findOneBy(entities_1.TimetableLocation, {
                id: dto.locationId,
                organizationId: year.organizationId,
            })
            : null;
        if (dto.locationId && !location)
            this.fail("TIMETABLE_LOCATION_SCOPE", "اتاق در این مدرسه پیدا نشد.");
        return { classroom, book, teacher, location };
    }
    async lessonViews(manager, versionId) {
        const rows = await manager.find(entities_1.SchoolScheduleEntry, {
            where: { versionId, status: "ACTIVE" },
            relations: { classroom: true, classBook: { book: true }, teacher: true },
            order: { weekday: "ASC", startTime: "ASC" },
        });
        const periods = await manager.find(entities_1.TimetablePeriod);
        const sessions = await manager.find(entities_1.TimetableDailySession);
        const locations = await manager.find(entities_1.TimetableLocation);
        return rows.map((row) => ({
            id: row.id,
            versionId,
            classroomId: row.classroom.id,
            classBookId: row.classBook.id,
            teacherId: row.teacher?.id ?? null,
            periodId: row.periodId,
            locationId: row.locationId,
            weekday: row.weekday,
            startTime: row.startTime,
            endTime: row.endTime,
            startsOn: row.startsOn,
            endsOn: row.endsOn,
            notes: row.notes,
            title: row.title,
            classroomName: row.classroomNameSnapshot || row.classroom.name,
            teacherName: row.teacherNameSnapshot ||
                (row.teacher ? this.person(row.teacher) : "استاد تعیین نشده"),
            locationName: row.room,
            sectionId: row.classroom.timetableSectionId,
            gradeId: row.classroom.gradeId,
            periodName: periods.find((x) => x.id === row.periodId)?.name ?? "",
            sessionKind: sessions.find((x) => x.id === periods.find((p) => p.id === row.periodId)?.sessionId)?.kind ?? "OTHER",
        }));
    }
    async versionData(manager, version, term, year) {
        const lessons = await this.lessonViews(manager, version.id);
        const overrides = (await manager.find(entities_1.TimetableOverride, {
            where: { versionId: version.id },
        })).map((row) => ({
            ...row,
            createdAt: row.createdAt.toISOString(),
        }));
        const holidays = await manager.find(entities_1.TimetableHoliday, {
            where: { termId: term.id },
        });
        const availability = await manager.find(entities_1.TimetableTeacherAvailability, {
            where: { organizationId: year.organizationId },
        });
        const allocations = await manager.find(entities_1.TimetableAllocation, {
            where: { versionId: version.id },
        });
        const bells = await manager.find(entities_1.TimetableBellSchedule, {
            where: { organizationId: year.organizationId },
        });
        const sessions = bells.length
            ? await manager.find(entities_1.TimetableDailySession, {
                where: { bellId: (0, typeorm_1.In)(bells.map((x) => x.id)) },
            })
            : [];
        const periods = sessions.length
            ? await manager.find(entities_1.TimetablePeriod, {
                where: { sessionId: (0, typeorm_1.In)(sessions.map((x) => x.id)) },
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
            startsOn: version.effectiveOn > term.startsOn
                ? version.effectiveOn
                : term.startsOn,
            endsOn: term.endsOn,
            timeZone: year.timeZone,
        };
    }
    async workspace(user, organizationId, versionId, startsOn) {
        await this.school(user, organizationId);
        const manager = this.database.manager;
        const years = await manager.find(entities_1.TimetableAcademicYear, {
            where: { organizationId },
            order: { startsOn: "DESC" },
        });
        const terms = years.length
            ? await manager.find(entities_1.TimetableTerm, {
                where: { yearId: (0, typeorm_1.In)(years.map((x) => x.id)) },
            })
            : [];
        const full = !!user.capabilities?.includes("schedule.read.all");
        const versions = terms.length
            ? await manager.find(entities_1.TimetableVersion, {
                where: {
                    termId: (0, typeorm_1.In)(terms.map((x) => x.id)),
                    ...(full ? {} : { state: (0, typeorm_1.In)(["PUBLISHED", "ARCHIVED"]) }),
                },
                order: { createdAt: "DESC" },
            })
            : [];
        if (startsOn) {
            try {
                (0, timetable_domain_1.canonicalDate)(startsOn);
            }
            catch {
                this.fail("TIMETABLE_DATE_RANGE", "تاریخ هفته معتبر نیست.");
            }
        }
        const feedDate = startsOn ??
            new Intl.DateTimeFormat("en-CA", {
                timeZone: years.find((y) => y.active)?.timeZone ?? "Asia/Tehran",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).format(new Date());
        const selected = versionId
            ? versions.find((x) => x.id === versionId)
            : [...versions]
                .filter((x) => x.state !== "DRAFT" &&
                years.find((y) => y.id === terms.find((t) => t.id === x.termId)?.yearId)?.active &&
                x.effectiveOn <= (0, timetable_domain_1.addDays)(feedDate, 6) &&
                terms.find((t) => t.id === x.termId).endsOn >= feedDate)
                .sort((a, b) => b.effectiveOn.localeCompare(a.effectiveOn) ||
                b.publishedAt.getTime() - a.publishedAt.getTime())[0];
        if (versionId && !selected)
            this.fail("TIMETABLE_NOT_FOUND", "این نسخه در دسترس نیست.", 404);
        const classroomRows = await manager.find(entities_1.EducationClass, {
            where: { organization: { id: organizationId }, status: "ACTIVE" },
            relations: { books: { book: true, teacher: true } },
        });
        const teacherRows = await manager.find(entities_1.UserRoleAssignment, {
            where: {
                role: { code: "TEACHER" },
                membership: {
                    organization: { id: organizationId },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                },
                user: { status: user_entity_1.UserStatus.ACTIVE },
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
        const sections = await manager.find(entities_1.TimetableSection, {
            where: { organizationId },
        });
        const locations = await manager.find(entities_1.TimetableLocation, {
            where: { organizationId },
        });
        let data = null;
        if (selected) {
            const { term, year } = await this.term(manager, selected.termId);
            data = await this.versionData(manager, selected, term, year);
        }
        if (!versionId && startsOn && data) {
            const feedVersions = versions.filter((v) => v.state !== "DRAFT" &&
                years.find((y) => y.id === terms.find((t) => t.id === v.termId)?.yearId)?.active &&
                v.effectiveOn <= (0, timetable_domain_1.addDays)(startsOn, 6) &&
                terms.find((t) => t.id === v.termId).endsOn >= startsOn);
            const feedLessons = [];
            const feedOverrides = [];
            const feedHolidays = [];
            for (const version of feedVersions) {
                const scope = await this.term(manager, version.termId);
                const snapshot = await this.versionData(manager, version, scope.term, scope.year);
                const successor = versions
                    .filter((v) => v.termId === version.termId &&
                    v.state !== "DRAFT" &&
                    (v.effectiveOn > version.effectiveOn ||
                        (v.effectiveOn === version.effectiveOn &&
                            v.publishedAt.getTime() > version.publishedAt.getTime())))
                    .sort((a, b) => a.effectiveOn.localeCompare(b.effectiveOn))[0];
                const endsOn = successor
                    ? (0, timetable_domain_1.addDays)(successor.effectiveOn, -1)
                    : scope.term.endsOn;
                feedLessons.push(...snapshot.lessons
                    .filter((l) => l.startsOn <= endsOn)
                    .map((l) => ({
                    ...l,
                    endsOn: l.endsOn > endsOn ? endsOn : l.endsOn,
                })));
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
        const bells = data?.bells ??
            (await manager.find(entities_1.TimetableBellSchedule, {
                where: { organizationId },
            }));
        const sessions = data?.sessions ??
            (bells.length
                ? await manager.find(entities_1.TimetableDailySession, {
                    where: { bellId: (0, typeorm_1.In)(bells.map((x) => x.id)) },
                })
                : []);
        const periods = data?.periods ??
            (sessions.length
                ? await manager.find(entities_1.TimetablePeriod, {
                    where: { sessionId: (0, typeorm_1.In)(sessions.map((x) => x.id)) },
                })
                : []);
        let allowedClasses = new Set(classes.map((x) => x.id));
        if (!full) {
            const student = await manager.findOneBy(entities_1.User, { id: user.id });
            const enrollments = await manager.find(entities_1.EducationClassEnrollment, {
                where: {
                    student: { user: { id: user.id }, accountStatus: "active" },
                    classroom: { organization: { id: organizationId } },
                },
                relations: { classroom: true },
            });
            allowedClasses = new Set(enrollments.map((x) => x.classroom.id));
            if (teacherRows.some((x) => x.user.id === student?.id))
                allowedClasses = new Set(data?.lessons
                    .filter((x) => x.teacherId === user.id ||
                    data?.overrides.some((o) => o.lessonId === x.id && o.teacherId === user.id))
                    .map((x) => x.classroomId) ?? []);
        }
        const lessons = (data?.lessons ?? []).filter((x) => full ||
            (allowedClasses.has(x.classroomId) &&
                (!teacherRows.some((t) => t.user.id === user.id) ||
                    x.teacherId === user.id ||
                    data?.overrides.some((o) => o.lessonId === x.id && o.teacherId === user.id))));
        const overrides = (data?.overrides ?? []).filter((x) => lessons.some((l) => l.id === x.lessonId));
        let occurrences = [];
        if (data && startsOn) {
            this.dates(startsOn, (0, timetable_domain_1.addDays)(startsOn, 6));
            occurrences = (0, timetable_domain_1.occurrencesForRange)(lessons, overrides, data.holidays, startsOn, (0, timetable_domain_1.addDays)(startsOn, 6), data.timeZone);
            const linked = lessons.length
                ? await manager.find(entities_1.TimetableOccurrence, {
                    where: { lessonId: (0, typeorm_1.In)(lessons.map((x) => x.id)) },
                })
                : [];
            if (!full && teacherRows.some((x) => x.user.id === user.id))
                occurrences = occurrences.filter((x) => x.teacherId === user.id);
            occurrences = occurrences.map((row) => ({
                ...row,
                attendanceSessionId: linked.find((x) => x.lessonId === row.id && x.date === row.date)
                    ?.attendanceSessionId ?? null,
                teacherName: row.teacherId === lessons.find((x) => x.id === row.id)?.teacherId
                    ? row.teacherName
                    : teacherRows.find((x) => x.user.id === row.teacherId)
                        ? this.person(teacherRows.find((x) => x.user.id === row.teacherId).user)
                        : row.teacherName,
                locationName: locations.find((x) => x.id === row.locationId)?.name ??
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
            changes: full && selected
                ? (await manager.find(entities_1.TimetableChange, {
                    where: { versionId: selected.id },
                    order: { createdAt: "DESC" },
                    take: 100,
                })).map((x) => ({ ...x, createdAt: x.createdAt.toISOString() }))
                : [],
            classes: classes.filter((x) => full || allowedClasses.has(x.id)),
            teachers: full
                ? [
                    ...new Map(teacherRows.map((x) => [
                        x.user.id,
                        { id: x.user.id, name: this.person(x.user) },
                    ])).values(),
                ]
                : [],
            conflicts: full && data ? (0, timetable_domain_1.detectTimetableConflicts)(data) : [],
            occurrences,
        };
    }
    async createVersion(user, organizationId, dto) {
        await this.school(user, organizationId, "schedule.create");
        return (0, attendance_1.attendanceTransaction)(this.database.manager, async (manager) => {
            const { term, year } = await this.term(manager, dto.termId);
            if (year.organizationId !== organizationId)
                this.fail("TIMETABLE_SCOPE", "نیم‌سال متعلق به این مدرسه نیست.");
            (0, timetable_domain_1.canonicalDate)(dto.effectiveOn);
            if (dto.effectiveOn < term.startsOn || dto.effectiveOn > term.endsOn)
                this.fail("TIMETABLE_DATE_RANGE", "تاریخ اجرا خارج از نیم‌سال است.");
            const version = await manager.save(entities_1.TimetableVersion, manager.create(entities_1.TimetableVersion, {
                termId: term.id,
                name: dto.name,
                state: "DRAFT",
                revision: 0,
                effectiveOn: dto.effectiveOn,
                reason: dto.reason,
                publishedAt: null,
                createdById: user.id,
            }));
            if (dto.copyVersionId) {
                const source = await this.version(user, dto.copyVersionId, "schedule.read.all", manager);
                if (source.year.organizationId !== organizationId ||
                    source.term.id !== term.id)
                    this.fail("TIMETABLE_COPY_SCOPE", "کپی فقط در همان نیم‌سال مجاز است.");
                const rows = await manager.find(entities_1.SchoolScheduleEntry, {
                    where: { versionId: source.version.id, status: "ACTIVE" },
                    relations: {
                        organization: true,
                        classroom: true,
                        classBook: true,
                        teacher: true,
                    },
                });
                for (const row of rows)
                    if (row.endsOn >= version.effectiveOn)
                        await manager.save(entities_1.SchoolScheduleEntry, manager.create(entities_1.SchoolScheduleEntry, {
                            ...row,
                            id: (0, node_crypto_1.randomUUID)(),
                            versionId: version.id,
                            startsOn: row.startsOn < version.effectiveOn
                                ? version.effectiveOn
                                : row.startsOn,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }));
                const allocations = await manager.find(entities_1.TimetableAllocation, {
                    where: { versionId: source.version.id },
                });
                for (const row of allocations)
                    await manager.save(entities_1.TimetableAllocation, manager.create(entities_1.TimetableAllocation, {
                        ...row,
                        id: (0, node_crypto_1.randomUUID)(),
                        versionId: version.id,
                    }));
            }
            await this.audit(manager, user, version, "draft.created", "", version.name, dto.reason);
            return this.versionView(version);
        });
    }
    async saveLesson(manager, user, version, term, year, dto, id) {
        const context = await this.validateLesson(manager, dto, version, term, year);
        const existing = id
            ? await manager.findOneBy(entities_1.SchoolScheduleEntry, {
                id,
                versionId: version.id,
            })
            : null;
        if (id && !existing)
            this.fail("TIMETABLE_NOT_FOUND", "درس پیدا نشد.", 404);
        if (!existing &&
            (await manager.countBy(entities_1.SchoolScheduleEntry, {
                versionId: version.id,
                status: "ACTIVE",
            })) >= 500)
            this.fail("TIMETABLE_LIMIT", "حداکثر ۵۰۰ درس در هر نسخه مجاز است.");
        const before = existing
            ? `${existing.title} ${existing.weekday} ${existing.startTime}-${existing.endTime}`
            : "";
        const row = await manager.save(entities_1.SchoolScheduleEntry, manager.create(entities_1.SchoolScheduleEntry, {
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
        }));
        await this.audit(manager, user, version, existing ? "lesson.updated" : "lesson.created", before, `${row.title} ${row.weekday} ${row.startTime}-${row.endTime}`, dto.notes ?? "", row.id);
        return row;
    }
    async writeLesson(user, versionId, dto, id, preview = false) {
        return (0, attendance_1.attendanceTransaction)(this.database.manager, async (manager) => {
            const { version, term, year } = await this.version(user, versionId, id ? "schedule.update" : "schedule.create", manager);
            this.revision(version, dto.expectedRevision);
            const context = await this.validateLesson(manager, dto.lesson, version, term, year);
            const data = await this.versionData(manager, version, term, year);
            const candidate = {
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
            const conflicts = (0, timetable_domain_1.detectTimetableConflicts)(data).filter((x) => x.lessonIds.includes(candidate.id) &&
                x.code !== "INCOMPLETE_ALLOCATION");
            if (preview)
                return { conflicts };
            if (conflicts.some((x) => x.code !== "UNASSIGNED"))
                this.fail("TIMETABLE_CONFLICT", "تداخل زمانی را پیش از ذخیره برطرف کنید.", 409, conflicts);
            const row = await this.saveLesson(manager, user, version, term, year, dto.lesson, id);
            version.revision++;
            await manager.save(version);
            return { id: row.id, revision: version.revision };
        });
    }
    async removeLesson(user, versionId, id, expectedRevision) {
        return (0, attendance_1.attendanceTransaction)(this.database.manager, async (manager) => {
            const { version } = await this.version(user, versionId, "schedule.delete", manager);
            this.revision(version, expectedRevision);
            const row = await manager.findOneBy(entities_1.SchoolScheduleEntry, {
                id,
                versionId,
            });
            if (!row)
                this.fail("TIMETABLE_NOT_FOUND", "درس پیدا نشد.", 404);
            row.status = "ARCHIVED";
            await manager.save(row);
            version.revision++;
            await manager.save(version);
            await this.audit(manager, user, version, "lesson.removed", row.title, "", "حذف از پیش‌نویس", id);
            return { revision: version.revision };
        });
    }
    async publish(user, id, dto) {
        const result = await (0, attendance_1.attendanceTransaction)(this.database.manager, async (manager) => {
            const { version, term, year } = await this.version(user, id, "schedule.publish", manager);
            this.revision(version, dto.expectedRevision);
            const data = await this.versionData(manager, version, term, year);
            if (!data.lessons.length)
                this.fail("TIMETABLE_EMPTY", "برنامه خالی قابل انتشار نیست.");
            const conflicts = (0, timetable_domain_1.detectTimetableConflicts)(data);
            if (conflicts.length)
                this.fail("TIMETABLE_CONFLICT", "تداخل‌ها و تخصیص‌های ناقص را برطرف کنید.", 409, conflicts);
            const previous = await manager.find(entities_1.TimetableVersion, {
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
            await this.audit(manager, user, version, "version.published", previous.map((x) => x.name).join("، "), version.name, dto.reason);
            return {
                version: this.versionView(version),
                lessons: data.lessons,
                organizationId: year.organizationId,
                reason: dto.reason,
            };
        });
        await this.notifyChange(result.organizationId, result.lessons, `برنامه ${result.version.name} منتشر شد.`, result.reason, `timetable:${id}:${result.version.revision}`);
        return result.version;
    }
    async notifyChange(organizationId, lessons, title, body, key) {
        const classIds = [...new Set(lessons.map((x) => x.classroomId))];
        const enrolled = classIds.length
            ? await this.database.manager.find(entities_1.EducationClassEnrollment, {
                where: {
                    classroom: {
                        id: (0, typeorm_1.In)(classIds),
                        organization: { id: organizationId },
                    },
                    student: {
                        accountStatus: "active",
                        user: { status: user_entity_1.UserStatus.ACTIVE },
                    },
                },
                relations: { student: { user: true } },
            })
            : [];
        const ids = [
            ...lessons.map((x) => x.teacherId).filter((x) => !!x),
            ...enrolled
                .map((x) => x.student.user?.id)
                .filter((x) => !!x),
        ];
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
    async override(user, id, dto) {
        const result = await (0, attendance_1.attendanceTransaction)(this.database.manager, async (manager) => {
            const { version, term, year } = await this.version(user, id, "schedule.publish", manager);
            this.revision(version, dto.expectedRevision, false);
            if (version.state !== "PUBLISHED")
                this.fail("TIMETABLE_STATE", "استثنا فقط برای نسخه فعال مجاز است.", 409);
            const data = await this.versionData(manager, version, term, year);
            const lesson = data.lessons.find((x) => x.id === dto.lessonId);
            if (!lesson ||
                dto.date < lesson.startsOn ||
                dto.date > lesson.endsOn ||
                (0, timetable_domain_1.weekdayOf)(dto.date) !== lesson.weekday)
                this.fail("TIMETABLE_OCCURRENCE", "تاریخ متعلق به این درس نیست.");
            if (dto.teacherId)
                await this.teacher(manager, dto.teacherId, year.organizationId);
            if (dto.locationId &&
                !(await manager.findOneBy(entities_1.TimetableLocation, {
                    id: dto.locationId,
                    organizationId: year.organizationId,
                })))
                this.fail("TIMETABLE_LOCATION_SCOPE", "اتاق در این مدرسه پیدا نشد.");
            this.times(dto.startTime ?? lesson.startTime, dto.endTime ?? lesson.endTime);
            const previous = await manager.findOneBy(entities_1.TimetableOverride, {
                lessonId: lesson.id,
                date: dto.date,
            });
            const change = manager.create(entities_1.TimetableOverride, {
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
                ...data.overrides.filter((x) => !(x.lessonId === lesson.id && x.date === dto.date)),
                {
                    ...change,
                    id: previous?.id ?? "preview",
                    createdAt: new Date().toISOString(),
                },
            ];
            const conflicts = (0, timetable_domain_1.detectTimetableConflicts)(data).filter((x) => x.lessonIds.includes(lesson.id) && x.date === dto.date);
            if (conflicts.length)
                this.fail("TIMETABLE_CONFLICT", "استثنا تداخل ایجاد می‌کند.", 409, conflicts);
            const row = await manager.save(change);
            if (dto.teacherId && !dto.cancelled) {
                const linked = await manager.findOneBy(entities_1.TimetableOccurrence, {
                    lessonId: lesson.id,
                    date: dto.date,
                });
                if (linked?.attendanceSessionId)
                    await this.attendance.reassignTimetableSession(linked.attendanceSessionId, lesson.id, dto.teacherId);
            }
            if (dto.cancelled) {
                const linked = await manager.findOneBy(entities_1.TimetableOccurrence, {
                    lessonId: lesson.id,
                    date: dto.date,
                });
                if (linked?.attendanceSessionId)
                    await this.attendance.cancelTimetableSession(linked.attendanceSessionId, lesson.id);
            }
            version.revision++;
            await manager.save(version);
            await this.audit(manager, user, version, dto.cancelled ? "lesson.cancelled" : "lesson.substituted", `${lesson.title} ${lesson.startTime}-${lesson.endTime}`, dto.cancelled
                ? "لغو"
                : `${dto.startTime ?? lesson.startTime}-${dto.endTime ?? lesson.endTime}`, `${dto.date}: ${dto.reason}`, lesson.id);
            return {
                change: { ...row, createdAt: row.createdAt.toISOString() },
                lesson,
                organizationId: year.organizationId,
                revision: version.revision,
            };
        });
        await this.notifyChange(result.organizationId, [result.lesson], "تغییر برنامه درسی", `${dto.date}: ${result.lesson.title}؛ ${dto.cancelled ? "لغو درس" : `${dto.startTime ?? result.lesson.startTime} تا ${dto.endTime ?? result.lesson.endTime}`}؛ ${dto.reason}؛ ${this.name(user)}`, `timetable-override:${result.change.id}:${result.revision}`);
        return result.change;
    }
    async config(user, organizationId, dto) {
        await this.school(user, organizationId, "schedule.update");
        return (0, attendance_1.attendanceTransaction)(this.database.manager, async (manager) => {
            const name = () => {
                if (!dto.name?.trim())
                    this.fail("TIMETABLE_REQUIRED", "نام لازم است.");
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
                }
                catch {
                    this.fail("TIMETABLE_TIMEZONE", "منطقه زمانی IANA معتبر لازم است.");
                }
                if (dto.id) {
                    const existing = await manager.findOneBy(entities_1.TimetableAcademicYear, {
                        id: dto.id,
                        organizationId,
                    });
                    if (!existing)
                        this.fail("TIMETABLE_NOT_FOUND", "سال پیدا نشد.", 404);
                    if (existing.startsOn !== dates.startsOn ||
                        existing.endsOn !== dates.endsOn ||
                        existing.timeZone !== timeZone)
                        this.fail("TIMETABLE_IMMUTABLE", "سال دارای برنامه را تغییر ندهید؛ سال جدید بسازید.", 409);
                    if (dto.active)
                        await manager.update(entities_1.TimetableAcademicYear, { organizationId }, { active: false });
                    existing.active = !!dto.active;
                    return manager.save(existing);
                }
                if (dto.active)
                    await manager.update(entities_1.TimetableAcademicYear, { organizationId }, { active: false });
                return manager.save(entities_1.TimetableAcademicYear, manager.create(entities_1.TimetableAcademicYear, {
                    organizationId,
                    name: name(),
                    ...dates,
                    timeZone,
                    active: !!dto.active,
                }));
            }
            if (dto.id)
                this.fail("TIMETABLE_CONFIG_IMMUTABLE", "پیکربندی ثبت‌شده برای حفظ تاریخچه قابل بازنویسی نیست.", 409);
            if (dto.kind === "section")
                return manager.save(entities_1.TimetableSection, manager.create(entities_1.TimetableSection, { organizationId, name: name() }));
            if (dto.kind === "location")
                return manager.save(entities_1.TimetableLocation, manager.create(entities_1.TimetableLocation, {
                    organizationId,
                    name: name(),
                    capacity: dto.number ?? 35,
                }));
            if (dto.kind === "classSection") {
                const classroom = await manager.findOne(entities_1.EducationClass, {
                    where: { id: dto.classroomId, organization: { id: organizationId } },
                });
                const section = dto.sectionId &&
                    (await manager.findOneBy(entities_1.TimetableSection, {
                        id: dto.sectionId,
                        organizationId,
                    }));
                if (!classroom || !section)
                    this.fail("TIMETABLE_SCOPE", "کلاس و بخش معتبر لازم است.");
                classroom.timetableSectionId = section.id;
                return manager.save(classroom);
            }
            if (["term", "session", "period", "holiday"].includes(dto.kind) &&
                !dto.parentId)
                this.fail("TIMETABLE_REQUIRED", "انتخاب پیکربندی والد لازم است.");
            if (dto.kind === "term") {
                const year = await manager.findOneBy(entities_1.TimetableAcademicYear, {
                    id: dto.parentId,
                    organizationId,
                });
                const dates = interval();
                if (!year ||
                    dates.startsOn < year.startsOn ||
                    dates.endsOn > year.endsOn)
                    this.fail("TIMETABLE_DATE_RANGE", "نیم‌سال باید در سال تحصیلی باشد.");
                return manager.save(entities_1.TimetableTerm, manager.create(entities_1.TimetableTerm, {
                    yearId: year.id,
                    name: name(),
                    ...dates,
                }));
            }
            if (dto.kind === "bell") {
                if (dto.sectionId &&
                    !(await manager.findOneBy(entities_1.TimetableSection, {
                        id: dto.sectionId,
                        organizationId,
                    })))
                    this.fail("TIMETABLE_SCOPE", "بخش مدرسه پیدا نشد.");
                return manager.save(entities_1.TimetableBellSchedule, manager.create(entities_1.TimetableBellSchedule, {
                    organizationId,
                    sectionId: dto.sectionId ?? null,
                    name: name(),
                }));
            }
            if (dto.kind === "session") {
                const bell = await manager.findOneBy(entities_1.TimetableBellSchedule, {
                    id: dto.parentId,
                    organizationId,
                });
                if (!bell)
                    this.fail("TIMETABLE_SCOPE", "برنامه زنگ پیدا نشد.");
                return manager.save(entities_1.TimetableDailySession, manager.create(entities_1.TimetableDailySession, {
                    bellId: bell.id,
                    name: name(),
                    kind: dto.sessionKind ?? "MORNING",
                    ...times(),
                }));
            }
            if (dto.kind === "period") {
                const session = await manager.findOneBy(entities_1.TimetableDailySession, {
                    id: dto.parentId,
                });
                const bell = session &&
                    (await manager.findOneBy(entities_1.TimetableBellSchedule, {
                        id: session.bellId,
                        organizationId,
                    }));
                const clock = times();
                if (!session ||
                    !bell ||
                    clock.startTime < session.startTime ||
                    clock.endTime > session.endTime)
                    this.fail("TIMETABLE_TIME_RANGE", "زنگ باید در ساعت نوبت باشد.");
                return manager.save(entities_1.TimetablePeriod, manager.create(entities_1.TimetablePeriod, {
                    sessionId: session.id,
                    name: name(),
                    ordinal: dto.number ?? 1,
                    ...clock,
                }));
            }
            if (dto.kind === "holiday") {
                if (!dto.parentId || !dto.date)
                    this.fail("TIMETABLE_REQUIRED", "نیم‌سال و تاریخ لازم است.");
                const { term, year } = await this.term(manager, dto.parentId);
                if (year.organizationId !== organizationId ||
                    dto.date < term.startsOn ||
                    dto.date > term.endsOn)
                    this.fail("TIMETABLE_SCOPE", "تعطیلی خارج از نیم‌سال است.");
                return manager.save(entities_1.TimetableHoliday, manager.create(entities_1.TimetableHoliday, {
                    termId: term.id,
                    date: dto.date,
                    name: name(),
                }));
            }
            if (dto.kind === "availability") {
                if (!dto.teacherId || dto.weekday === undefined)
                    this.fail("TIMETABLE_REQUIRED", "استاد و روز لازم است.");
                await this.teacher(manager, dto.teacherId, organizationId);
                const row = manager.create(entities_1.TimetableTeacherAvailability, {
                    organizationId,
                    teacherId: dto.teacherId,
                    weekday: dto.weekday,
                    ...interval(),
                    ...times(),
                    reason: dto.reason ?? "",
                });
                const years = await manager.find(entities_1.TimetableAcademicYear, {
                    where: { organizationId },
                });
                const terms = years.length
                    ? await manager.find(entities_1.TimetableTerm, {
                        where: { yearId: (0, typeorm_1.In)(years.map((x) => x.id)) },
                    })
                    : [];
                const published = terms.length
                    ? await manager.find(entities_1.TimetableVersion, {
                        where: { termId: (0, typeorm_1.In)(terms.map((x) => x.id)), state: "PUBLISHED" },
                    })
                    : [];
                for (const version of published) {
                    const { term, year } = await this.term(manager, version.termId);
                    const data = await this.versionData(manager, version, term, year);
                    data.availability.push(row);
                    const conflicts = (0, timetable_domain_1.detectTimetableConflicts)(data);
                    if (conflicts.some((x) => x.code === "TEACHER_UNAVAILABLE"))
                        this.fail("TIMETABLE_CONFLICT", "ابتدا برای درس‌های منتشرشده استاد جایگزین تعیین کنید.", 409, conflicts);
                }
                return manager.save(row);
            }
            if (dto.kind === "allocation") {
                if (!dto.parentId ||
                    !dto.classroomId ||
                    !dto.classBookId ||
                    dto.expectedRevision === undefined)
                    this.fail("TIMETABLE_REQUIRED", "نسخه و کتاب کلاس لازم است.");
                const { version, year } = await this.version(user, dto.parentId, "schedule.update", manager);
                if (year.organizationId !== organizationId)
                    this.fail("TIMETABLE_SCOPE", "نسخه خارج از مدرسه است.");
                this.revision(version, dto.expectedRevision);
                const book = await manager.findOne(entities_1.EducationClassBook, {
                    where: {
                        id: dto.classBookId,
                        classroom: {
                            id: dto.classroomId,
                            organization: { id: organizationId },
                        },
                    },
                });
                if (!book)
                    this.fail("TIMETABLE_SCOPE", "کتاب کلاس پیدا نشد.");
                const old = await manager.findOneBy(entities_1.TimetableAllocation, {
                    versionId: version.id,
                    classBookId: book.id,
                });
                const row = await manager.save(entities_1.TimetableAllocation, manager.create(entities_1.TimetableAllocation, {
                    ...(old ?? {}),
                    versionId: version.id,
                    classroomId: dto.classroomId,
                    classBookId: book.id,
                    lessonsPerWeek: dto.number ?? 1,
                }));
                version.revision++;
                await manager.save(version);
                await this.audit(manager, user, version, "allocation.updated", String(old?.lessonsPerWeek ?? 0), String(row.lessonsPerWeek), "تخصیص هفتگی کتاب");
                return row;
            }
            this.fail("TIMETABLE_CONFIG_KIND", "نوع پیکربندی معتبر نیست.");
        });
    }
    async previewRows(manager, user, id, dto) {
        const { version, term, year } = await this.version(user, id, "schedule.import", manager);
        this.revision(version, dto.expectedRevision);
        const rows = [];
        const data = await this.versionData(manager, version, term, year);
        for (let index = 0; index < dto.rows.length; index++) {
            const item = dto.rows[index];
            const errors = [];
            try {
                const checked = await this.validateLesson(manager, item.lesson, version, term, year);
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
            }
            catch (error) {
                errors.push(error instanceof api_exception_1.ApiException ? error.getResponse().error.message : "ردیف نامعتبر است.");
            }
            rows.push({ row: index + 1, source: item.source, errors });
        }
        const conflicts = (0, timetable_domain_1.detectTimetableConflicts)(data);
        return {
            valid: rows.every((row) => !row.errors.length) && !conflicts.length,
            revision: version.revision,
            rows,
            conflicts,
        };
    }
    async previewImport(user, id, dto) {
        return this.previewRows(this.database.manager, user, id, dto);
    }
    async commitImport(user, id, dto) {
        return (0, attendance_1.attendanceTransaction)(this.database.manager, async (manager) => {
            const preview = await this.previewRows(manager, user, id, dto);
            if (!preview.valid)
                this.fail("TIMETABLE_IMPORT_INVALID", "خطاهای نگاشت و تداخل را برطرف کنید.", 422, preview);
            const { version, term, year } = await this.version(user, id, "schedule.import", manager);
            for (const row of dto.rows)
                await this.saveLesson(manager, user, version, term, year, row.lesson);
            version.revision++;
            await manager.save(version);
            await manager.save(entities_1.TimetableImport, manager.create(entities_1.TimetableImport, {
                versionId: id,
                actorId: user.id,
                filename: dto.filename,
                sheetName: dto.sheetName,
                rowCount: dto.rows.length,
                revision: version.revision,
            }));
            await this.audit(manager, user, version, "import.committed", "", `${dto.rows.length} ردیف`, `${dto.filename} / ${dto.sheetName}`);
            return { imported: dto.rows.length, revision: version.revision };
        });
    }
    async openAttendance(user, id, date) {
        this.capability(user, "attendance.class.manage");
        return (0, attendance_1.attendanceTransaction)(this.database.manager, async (manager) => {
            const row = await manager.findOne(entities_1.SchoolScheduleEntry, {
                where: { id, status: "ACTIVE" },
                relations: { classroom: true },
            });
            if (!row?.versionId)
                this.fail("TIMETABLE_NOT_FOUND", "درس منتشرشده پیدا نشد.", 404);
            const { version, term, year } = await this.version(user, row.versionId, "schedule.read", manager);
            if (version.state === "DRAFT")
                this.fail("TIMETABLE_STATE", "حضور برای پیش‌نویس مجاز نیست.");
            const data = await this.versionData(manager, version, term, year);
            const occurrence = (0, timetable_domain_1.occurrencesForRange)(data.lessons, data.overrides, data.holidays, date, date, year.timeZone).find((x) => x.id === id);
            if (!occurrence)
                this.fail("TIMETABLE_OCCURRENCE", "درس در این تاریخ برگزار نمی‌شود.");
            if (!user.capabilities?.includes("schedule.read.all") &&
                user.id !== occurrence.teacherId)
                this.fail("FORBIDDEN", "فقط استاد این وقوع درس می‌تواند حضور را باز کند.", 403);
            const old = await manager.findOneBy(entities_1.TimetableOccurrence, {
                lessonId: id,
                date,
            });
            if (old?.attendanceSessionId)
                return {
                    sessionId: old.attendanceSessionId,
                    cancelled: occurrence.cancelled,
                };
            const successors = await manager.find(entities_1.TimetableVersion, {
                where: {
                    termId: term.id,
                    state: (0, typeorm_1.In)(["PUBLISHED", "ARCHIVED"]),
                },
            });
            if (successors.some((v) => v.id !== version.id &&
                v.effectiveOn <= date &&
                (v.effectiveOn > version.effectiveOn ||
                    (v.effectiveOn === version.effectiveOn &&
                        v.publishedAt.getTime() > version.publishedAt.getTime()))))
                this.fail("TIMETABLE_SUPERSEDED", "نسخه دیگری در این تاریخ اجرا می‌شود.", 409);
            if (occurrence.cancelled)
                this.fail("TIMETABLE_CANCELLED", "این درس لغو شده است؛ تاریخچه حضور حذف نشده است.", 409);
            const today = new Intl.DateTimeFormat("en-CA", {
                timeZone: year.timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).format(new Date());
            if (date !== today)
                this.fail("TIMETABLE_ATTENDANCE_DATE", "حضور را در روز برگزاری درس ثبت کنید.");
            const session = await this.attendance.createTimetableSession(user, {
                organizationId: year.organizationId,
                classroomId: row.classroom.id,
                lessonId: id,
                date,
                title: `${row.classroomNameSnapshot} · ${row.title}`,
                startsAt: occurrence.startsAt,
                endsAt: occurrence.endsAt,
                timeZone: year.timeZone,
                teacherId: occurrence.teacherId ?? null,
            });
            await manager.save(entities_1.TimetableOccurrence, manager.create(entities_1.TimetableOccurrence, {
                lessonId: id,
                date,
                attendanceSessionId: session.id,
            }));
            return { sessionId: session.id, cancelled: false };
        });
    }
};
exports.TimetableService = TimetableService;
exports.TimetableService = TimetableService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        school_access_1.SchoolAccessService,
        attendance_1.AttendanceService,
        notifications_1.NotificationsService])
], TimetableService);
//# sourceMappingURL=timetable.service.js.map