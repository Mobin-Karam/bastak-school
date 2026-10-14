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
exports.AcademicService = void 0;
const school_schedule_entry_entity_1 = require("../../database/entities/school-schedule-entry.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const academic_structure_entity_1 = require("../../database/entities/academic-structure.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_book_entity_1 = require("../../database/entities/education-book.entity");
const subject_entity_1 = require("../../database/entities/subject.entity");
const timetable_entity_1 = require("../../database/entities/timetable.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const school_access_1 = require("../school-access");
const attendance_1 = require("../attendance");
let AcademicService = class AcademicService {
    db;
    access;
    constructor(db, access) {
        this.db = db;
        this.access = access;
    }
    fail(code, message, status = 422) {
        throw new api_exception_1.ApiException(status, code, message);
    }
    async school(user, org, capability) {
        if (!user.capabilities?.includes(capability))
            this.fail("FORBIDDEN", "دسترسی کافی ندارید.", 403);
        return this.access.organizationForUser(user, org);
    }
    async subject(m, id, org) {
        const subject = await m.findOne(subject_entity_1.Subject, {
            where: { id, active: true },
            relations: { organization: true },
        });
        if (!subject || (subject.organization && subject.organization.id !== org))
            this.fail("ACADEMIC_SUBJECT_SCOPE", "درس خارج از مدرسه است.");
        return subject;
    }
    async subjects(user, org, page) {
        await this.school(user, org, "education.catalog.read");
        const [items, total] = await this.db.manager.findAndCount(subject_entity_1.Subject, {
            where: { organization: { id: org }, active: true },
            order: { name: "ASC", id: "ASC" },
            skip: page.offset,
            take: page.limit,
        });
        return { items, total, offset: page.offset, limit: page.limit };
    }
    async createSubject(user, org, dto) {
        await this.school(user, org, "education.catalog.manage");
        return (0, attendance_1.attendanceTransaction)(this.db.manager, async (m) => {
            const code = dto.code.trim().toLowerCase(), name = dto.name.trim(), category = dto.category?.trim() || "عمومی";
            if (!name)
                this.fail("ACADEMIC_SUBJECT_NAME", "نام درس لازم است.");
            if (await m.exists(subject_entity_1.Subject, { where: { organization: { id: org }, code } }))
                this.fail("SUBJECT_CODE_EXISTS", "کلید درس تکراری است.", 409);
            const row = await m.save(subject_entity_1.Subject, m.create(subject_entity_1.Subject, {
                organization: { id: org },
                code,
                name,
                category,
                active: true,
            }));
            await this.audit(m, user, org, "academic.subject.created", {
                subjectId: row.id,
            });
            return row;
        });
    }
    async teachers(user, org, page) {
        await this.school(user, org, "classes.read");
        if (!user.capabilities?.includes("schedule.read.all") &&
            !user.capabilities?.includes("classes.manage"))
            this.fail("FORBIDDEN", "فهرست کارکنان فقط برای مسئول مدرسه است.", 403);
        const [rows, total] = await this.db.manager.findAndCount(user_role_assignment_entity_1.UserRoleAssignment, {
            where: {
                role: { code: "TEACHER" },
                membership: {
                    organization: { id: org },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                },
                user: { status: user_entity_1.UserStatus.ACTIVE },
            },
            relations: { user: true, membership: true },
            order: { id: "ASC" },
            skip: page.offset,
            take: page.limit,
        });
        return {
            items: rows.map((r) => ({
                id: r.user.id,
                firstName: r.user.firstName,
                lastName: r.user.lastName,
                username: r.user.username,
                membershipId: r.membership?.id,
            })),
            total,
            offset: page.offset,
            limit: page.limit,
        };
    }
    async assignments(user, org, page) {
        await this.school(user, org, "classes.read");
        const full = user.capabilities?.includes("classes.manage") ||
            user.capabilities?.includes("schedule.read.all");
        if (!full && page.teacherId && page.teacherId !== user.id)
            this.fail("FORBIDDEN", "فقط تخصیص‌های خودتان در دسترس است.", 403);
        const [items, total] = await this.db.manager.findAndCount(academic_structure_entity_1.TeachingAssignment, {
            where: {
                organizationId: org,
                ...(!full
                    ? { teacherId: user.id }
                    : page.teacherId
                        ? { teacherId: page.teacherId }
                        : {}),
                ...(page.classroomId ? { classroomId: page.classroomId } : {}),
                ...(page.academicYearId
                    ? { academicYearId: page.academicYearId }
                    : {}),
            },
            order: { startsOn: "DESC", id: "ASC" },
            skip: page.offset,
            take: page.limit,
        });
        return { items, total, offset: page.offset, limit: page.limit };
    }
    async createAssignment(user, org, dto) {
        await this.school(user, org, "classes.manage");
        return (0, attendance_1.attendanceTransaction)(this.db.manager, async (m) => {
            const year = await m.findOneBy(timetable_entity_1.TimetableAcademicYear, {
                id: dto.academicYearId,
                organizationId: org,
            });
            const classroom = await m.findOne(education_class_entity_1.EducationClass, {
                where: {
                    id: dto.classroomId,
                    organization: { id: org },
                    status: "ACTIVE",
                },
            });
            const term = dto.termId
                ? await m.findOneBy(timetable_entity_1.TimetableTerm, {
                    id: dto.termId,
                    yearId: dto.academicYearId,
                })
                : null;
            if (!year ||
                !classroom ||
                classroom.academicYearId !== year.id ||
                (dto.termId && !term))
                this.fail("ACADEMIC_SCOPE", "کلاس، سال و نیم‌سال باید هم‌دامنه باشند.");
            const start = term?.startsOn ?? year.startsOn, end = term?.endsOn ?? year.endsOn;
            if (dto.startsOn < start || dto.endsOn > end || dto.endsOn < dto.startsOn)
                this.fail("ACADEMIC_DATE_RANGE", "تخصیص خارج از بازه تحصیلی است.");
            await this.subject(m, dto.subjectId, org);
            const roles = await m.find(user_role_assignment_entity_1.UserRoleAssignment, {
                where: {
                    user: { id: dto.teacherId, status: user_entity_1.UserStatus.ACTIVE },
                    role: { code: "TEACHER" },
                    membership: {
                        organization: { id: org },
                        status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                    },
                },
            });
            if (!roles.length)
                this.fail("ACADEMIC_TEACHER_SCOPE", "استاد باید حساب فعال تدریس در مدرسه داشته باشد.");
            const duplicate = await m
                .getRepository(academic_structure_entity_1.TeachingAssignment)
                .createQueryBuilder("a")
                .where("a.organizationId = :org AND a.classroomId = :classroom AND a.subjectId = :subject AND a.teacherId = :teacher AND a.status = :status", {
                org,
                classroom: dto.classroomId,
                subject: dto.subjectId,
                teacher: dto.teacherId,
                status: "ACTIVE",
            })
                .andWhere("a.startsOn <= :end AND a.endsOn >= :start", {
                start: dto.startsOn,
                end: dto.endsOn,
            })
                .getExists();
            if (duplicate)
                this.fail("ACADEMIC_ASSIGNMENT_OVERLAP", "تخصیص هم‌پوشان برای همین کلاس، درس و استاد وجود دارد.", 409);
            const row = await m.save(academic_structure_entity_1.TeachingAssignment, m.create(academic_structure_entity_1.TeachingAssignment, {
                ...dto,
                organizationId: org,
                termId: dto.termId ?? null,
                status: "ACTIVE",
                createdById: user.id,
            }));
            await this.audit(m, user, org, "academic.assignment.created", {
                assignmentId: row.id,
            });
            return row;
        });
    }
    async endAssignment(user, org, id, dto) {
        await this.school(user, org, "classes.manage");
        return (0, attendance_1.attendanceTransaction)(this.db.manager, async (m) => {
            const row = await m.findOneBy(academic_structure_entity_1.TeachingAssignment, {
                id,
                organizationId: org,
                status: "ACTIVE",
            });
            if (!row)
                this.fail("ACADEMIC_ASSIGNMENT_NOT_FOUND", "تخصیص پیدا نشد.", 404);
            if (dto.endsOn < row.startsOn || dto.endsOn > row.endsOn)
                this.fail("ACADEMIC_DATE_RANGE", "پایان باید در بازه تخصیص باشد.");
            const references = await m.findBy(academic_structure_entity_1.SubjectBookReference, {
                organizationId: org,
                subjectId: row.subjectId,
            });
            if (references.length) {
                const affected = await m
                    .getRepository(school_schedule_entry_entity_1.SchoolScheduleEntry)
                    .createQueryBuilder("lesson")
                    .innerJoin("lesson.classBook", "book")
                    .innerJoin("lesson.version", "version")
                    .where("lesson.classroomId = :classroom AND lesson.teacherId = :teacher AND book.bookId IN (:...books) AND lesson.endsOn > :end AND lesson.status = :active AND (version.state = :draft OR version.publishedAt IS NOT NULL)", {
                    classroom: row.classroomId,
                    teacher: row.teacherId,
                    books: references.map((r) => r.bookId),
                    end: dto.endsOn,
                    active: "ACTIVE",
                    draft: "DRAFT",
                })
                    .getExists();
                if (affected)
                    this.fail("ACADEMIC_ASSIGNMENT_IN_USE", "ابتدا درس‌های وابسته را اصلاح کنید.", 409);
            }
            const before = { endsOn: row.endsOn, status: row.status };
            row.endsOn = dto.endsOn;
            row.status = "ENDED";
            await m.save(row);
            await this.audit(m, user, org, "academic.assignment.ended", {
                assignmentId: id,
                before,
                after: { endsOn: row.endsOn, status: row.status },
                reason: dto.reason,
            });
            return row;
        });
    }
    async reference(user, org, dto) {
        await this.school(user, org, "education.catalog.manage");
        return (0, attendance_1.attendanceTransaction)(this.db.manager, async (m) => {
            await this.subject(m, dto.subjectId, org);
            const book = await m.findOneBy(education_book_entity_1.EducationBook, {
                id: dto.bookId,
                state: "PUBLISHED",
            });
            if (!book || (book.organizationId && book.organizationId !== org))
                this.fail("ACADEMIC_BOOK_SCOPE", "کتاب متعلق به دامنه مدرسه نیست.");
            const existing = await m.findOneBy(academic_structure_entity_1.SubjectBookReference, {
                organizationId: org,
                subjectId: dto.subjectId,
                bookId: dto.bookId,
            });
            if (existing)
                return existing;
            const row = await m.save(academic_structure_entity_1.SubjectBookReference, m.create(academic_structure_entity_1.SubjectBookReference, { ...dto, organizationId: org }));
            await this.audit(m, user, org, "academic.subject.book.linked", {
                referenceId: row.id,
            });
            return row;
        });
    }
    async references(user, org, page) {
        await this.school(user, org, "education.catalog.read");
        const [items, total] = await this.db.manager.findAndCount(academic_structure_entity_1.SubjectBookReference, {
            where: { organizationId: org },
            order: { id: "ASC" },
            skip: page.offset,
            take: page.limit,
        });
        return { items, total, offset: page.offset, limit: page.limit };
    }
    audit(m, user, org, action, metadata) {
        return m.save(audit_log_entity_1.AuditLog, m.create(audit_log_entity_1.AuditLog, {
            user: { id: user.id },
            organizationId: org,
            action,
            entity: "academic",
            metadata,
        }));
    }
};
exports.AcademicService = AcademicService;
exports.AcademicService = AcademicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        school_access_1.SchoolAccessService])
], AcademicService);
//# sourceMappingURL=academic.service.js.map