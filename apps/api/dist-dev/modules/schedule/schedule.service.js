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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_book_entity_1 = require("../../database/entities/education-class-book.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const school_schedule_entry_entity_1 = require("../../database/entities/school-schedule-entry.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const authorization_1 = require("../authorization");
let ScheduleService = class ScheduleService {
    entries;
    organizations;
    memberships;
    classes;
    classBooks;
    authorization;
    constructor(entries, organizations, memberships, classes, classBooks, authorization) {
        this.entries = entries;
        this.organizations = organizations;
        this.memberships = memberships;
        this.classes = classes;
        this.classBooks = classBooks;
        this.authorization = authorization;
    }
    context(user) {
        return {
            ...user,
            roles: user.roles || [user.role],
            capabilities: user.capabilities || [],
            membershipIds: user.membershipIds || [],
            organizationIds: user.organizationIds || [],
        };
    }
    isOperator(context) {
        return context.roles.some((role) => ["PLATFORM_ADMIN", "ORGANIZATION_ADMIN", "PRINCIPAL"].includes(role));
    }
    async list(user, organizationId) {
        const requestedOrganizationId = organizationId ?? user.activeOrganizationId;
        const context = this.context(user);
        this.authorization.requireCapability(context, "schedule.read");
        if (requestedOrganizationId &&
            !context.roles.includes("PLATFORM_ADMIN") &&
            !context.organizationIds.includes(requestedOrganizationId))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
        if (context.roles.includes("PLATFORM_ADMIN"))
            return this.entries.find({
                where: requestedOrganizationId
                    ? { organization: { id: requestedOrganizationId }, versionId: (0, typeorm_2.IsNull)() }
                    : { versionId: (0, typeorm_2.IsNull)() },
                relations: { organization: true, classroom: true, teacher: true, classBook: { book: true, teacher: true } },
                order: { weekday: "ASC", startTime: "ASC" },
            });
        if (this.isOperator(context))
            return this.entries.find({
                where: {
                    versionId: (0, typeorm_2.IsNull)(),
                    organization: {
                        id: (0, typeorm_2.In)(requestedOrganizationId
                            ? [requestedOrganizationId]
                            : context.organizationIds),
                    },
                },
                relations: { organization: true, classroom: true, teacher: true, classBook: { book: true, teacher: true } },
                order: { weekday: "ASC", startTime: "ASC" },
            });
        if (context.roles.includes("TEACHER"))
            return this.entries.find({
                where: {
                    versionId: (0, typeorm_2.IsNull)(),
                    teacher: { id: user.id },
                    classBook: { teacher: { id: user.id } },
                    organization: {
                        id: (0, typeorm_2.In)(requestedOrganizationId
                            ? [requestedOrganizationId]
                            : context.organizationIds),
                    },
                    status: "ACTIVE",
                },
                relations: { organization: true, classroom: true, teacher: true, classBook: { book: true, teacher: true } },
                order: { weekday: "ASC", startTime: "ASC" },
            });
        if (context.roles.some((role) => ["ADVISOR", "MENTOR", "COUNSELOR", "STUDENT_AFFAIRS_MENTOR"].includes(role))) {
            if (!context.organizationIds.length)
                return [];
            return this.entries.find({
                where: {
                    versionId: (0, typeorm_2.IsNull)(),
                    classroom: { advisor: { id: user.id } },
                    organization: {
                        id: (0, typeorm_2.In)(requestedOrganizationId
                            ? [requestedOrganizationId]
                            : context.organizationIds),
                    },
                    status: "ACTIVE",
                },
                relations: {
                    organization: true,
                    classroom: { advisor: true },
                    teacher: true,
                },
                order: { weekday: "ASC", startTime: "ASC" },
            });
        }
        if (context.roles.includes("GUARDIAN")) {
            const organizationIds = requestedOrganizationId
                ? [requestedOrganizationId]
                : context.organizationIds;
            if (!organizationIds.length)
                return [];
            return this.entries
                .createQueryBuilder("entry")
                .leftJoinAndSelect("entry.organization", "organization")
                .leftJoinAndSelect("entry.classroom", "classroom")
                .leftJoinAndSelect("entry.teacher", "teacher")
                .leftJoinAndSelect("entry.classBook", "classBook")
                .leftJoinAndSelect("classBook.book", "classBookBook")
                .leftJoinAndSelect("classBook.teacher", "classBookTeacher")
                .leftJoin(education_class_enrollment_entity_1.EducationClassEnrollment, "enrollment", "enrollment.classroomId = entry.classroomId")
                .leftJoin(user_relationship_entity_1.UserRelationship, "relationship", "relationship.toStudentId = enrollment.studentId AND relationship.fromUserId = :userId AND relationship.status = 'ACTIVE' AND relationship.type = 'GUARDIAN_OF'", { userId: user.id })
                .where("entry.status = 'ACTIVE'")
                .andWhere("entry.versionId IS NULL")
                .andWhere("entry.organizationId IN (:...organizationIds)", {
                organizationIds,
            })
                .andWhere("entry.classroomId IS NULL OR relationship.id IS NOT NULL")
                .orderBy("entry.weekday", "ASC")
                .addOrderBy("entry.startTime", "ASC")
                .getMany();
        }
        if (context.roles.includes("STUDENT")) {
            const organizationIds = requestedOrganizationId
                ? [requestedOrganizationId]
                : context.organizationIds;
            if (!organizationIds.length)
                return [];
            return this.entries
                .createQueryBuilder("entry")
                .leftJoinAndSelect("entry.organization", "organization")
                .leftJoinAndSelect("entry.classroom", "classroom")
                .leftJoinAndSelect("entry.teacher", "teacher")
                .leftJoinAndSelect("entry.classBook", "classBook")
                .leftJoinAndSelect("classBook.book", "classBookBook")
                .leftJoinAndSelect("classBook.teacher", "classBookTeacher")
                .leftJoin(education_class_enrollment_entity_1.EducationClassEnrollment, "enrollment", "enrollment.classroomId = entry.classroomId AND enrollment.studentId = (SELECT id FROM students WHERE userId = :userId LIMIT 1)", { userId: user.id })
                .where("entry.status = 'ACTIVE'")
                .andWhere("entry.versionId IS NULL")
                .andWhere("entry.organizationId IN (:...organizationIds)", {
                organizationIds,
            })
                .andWhere("entry.classroomId IS NULL OR enrollment.id IS NOT NULL")
                .orderBy("entry.weekday", "ASC")
                .addOrderBy("entry.startTime", "ASC")
                .getMany();
        }
        if (context.organizationIds.length) {
            return this.entries.find({
                where: {
                    versionId: (0, typeorm_2.IsNull)(),
                    organization: {
                        id: (0, typeorm_2.In)(requestedOrganizationId
                            ? [requestedOrganizationId]
                            : context.organizationIds),
                    },
                    status: "ACTIVE",
                },
                relations: { organization: true, classroom: true, teacher: true },
                order: { weekday: "ASC", startTime: "ASC" },
            });
        }
        return [];
    }
    async export(user, organizationId) {
        const context = this.context(user);
        this.authorization.requireCapability(context, "schedule.export");
        return this.list({
            ...user,
            capabilities: [
                ...new Set([...(user.capabilities || []), "schedule.read"]),
            ],
        }, organizationId);
    }
    async create(user, dto) {
        const context = this.context(user);
        this.authorization.requireCapability(context, "schedule.create");
        if (!this.isOperator(context) ||
            (!context.roles.includes("PLATFORM_ADMIN") &&
                !context.organizationIds.includes(dto.organizationId)))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
        const organization = await this.organizations.findOneBy({
            id: dto.organizationId,
        });
        if (!organization)
            throw new api_exception_1.ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
        const classroom = await this.classroomForOrganization(dto.classroomId, organization.id);
        const teacher = await this.teacherForOrganization(dto.teacherId, organization.id);
        const classBook = await this.classBookForSession(classroom, teacher, dto.classBookId);
        if (dto.endTime <= dto.startTime)
            throw new api_exception_1.ApiException(422, "INVALID_TIME_RANGE", "زمان پایان باید بعد از شروع باشد.");
        return this.entries.save(this.entries.create({
            ...dto,
            room: dto.room?.trim() || "",
            organization,
            classroom,
            classBook,
            teacher,
        }));
    }
    async update(user, id, dto) {
        const context = this.context(user);
        this.authorization.requireCapability(context, "schedule.update");
        const item = await this.entries.findOne({
            where: { id },
            relations: { organization: true },
        });
        if (!item)
            throw new api_exception_1.ApiException(404, "SCHEDULE_NOT_FOUND", "برنامه پیدا نشد.");
        if (!this.isOperator(context) ||
            (!context.roles.includes("PLATFORM_ADMIN") &&
                !context.organizationIds.includes(item.organization.id)))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
        if (item.versionId)
            throw new api_exception_1.ApiException(409, "TIMETABLE_IMMUTABLE", "این درس را از نسخه برنامه درسی مدیریت کنید.");
        if (dto.organizationId !== item.organization.id)
            throw new api_exception_1.ApiException(422, "SCHEDULE_ORGANIZATION_IMMUTABLE", "مدرسه برنامه قابل تغییر نیست.");
        if (dto.endTime <= dto.startTime)
            throw new api_exception_1.ApiException(422, "INVALID_TIME_RANGE", "زمان پایان باید بعد از شروع باشد.");
        const classroom = await this.classroomForOrganization(dto.classroomId, item.organization.id);
        const teacher = await this.teacherForOrganization(dto.teacherId, item.organization.id);
        const classBook = await this.classBookForSession(classroom, teacher, dto.classBookId);
        Object.assign(item, {
            title: dto.title.trim(),
            weekday: dto.weekday,
            startTime: dto.startTime,
            endTime: dto.endTime,
            room: dto.room?.trim() || "",
            classroom,
            classBook,
            teacher,
        });
        return this.entries.save(item);
    }
    async archive(user, id, dto) {
        const context = this.context(user);
        this.authorization.requireCapability(context, "schedule.archive");
        const item = await this.entries.findOne({
            where: { id },
            relations: { organization: true },
        });
        if (!item)
            throw new api_exception_1.ApiException(404, "SCHEDULE_NOT_FOUND", "برنامه پیدا نشد.");
        if (!this.isOperator(context) ||
            (!context.roles.includes("PLATFORM_ADMIN") &&
                !context.organizationIds.includes(item.organization.id)))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
        if (item.versionId)
            throw new api_exception_1.ApiException(409, "TIMETABLE_IMMUTABLE", "این درس را از نسخه برنامه درسی مدیریت کنید.");
        item.status = dto.status;
        return this.entries.save(item);
    }
    async remove(user, id) {
        const context = this.context(user);
        this.authorization.requireCapability(context, "schedule.delete");
        const item = await this.entries.findOne({
            where: { id },
            relations: { organization: true },
        });
        if (!item)
            throw new api_exception_1.ApiException(404, "SCHEDULE_NOT_FOUND", "برنامه پیدا نشد.");
        if (!this.isOperator(context) ||
            (!context.roles.includes("PLATFORM_ADMIN") &&
                !context.organizationIds.includes(item.organization.id)))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
        if (item.versionId)
            throw new api_exception_1.ApiException(409, "TIMETABLE_IMMUTABLE", "این درس را از نسخه برنامه درسی مدیریت کنید.");
        await this.entries.remove(item);
        return { deleted: true };
    }
    async previewImport(user, entries) {
        const context = this.context(user);
        this.authorization.requireCapability(context, "schedule.import");
        if (entries.length > 200)
            throw new api_exception_1.ApiException(422, "SCHEDULE_IMPORT_LIMIT", "حداکثر ۲۰۰ ردیف مجاز است.");
        const errors = entries.flatMap((item, index) => this.importErrors(context, item).map((message) => ({
            row: index + 2,
            message,
        })));
        return {
            valid: !errors.length,
            errors,
            summary: { rows: entries.length, valid: entries.length - errors.length },
        };
    }
    async commitImport(user, entries) {
        const preview = await this.previewImport(user, entries);
        if (!preview.valid)
            throw new api_exception_1.ApiException(422, "SCHEDULE_IMPORT_INVALID", "فایل برنامه معتبر نیست.", preview.errors);
        const saved = [];
        for (const entry of entries)
            saved.push(await this.create(user, entry));
        return { imported: saved.length, entries: saved };
    }
    importErrors(context, item) {
        const errors = [];
        if (!this.isOperator(context) ||
            (!context.roles.includes("PLATFORM_ADMIN") &&
                !context.organizationIds.includes(item.organizationId)))
            errors.push("مدرسه خارج از محدوده دسترسی است.");
        if (!item.title?.trim())
            errors.push("عنوان لازم است.");
        if (!Number.isInteger(item.weekday) || item.weekday < 0 || item.weekday > 6)
            errors.push("روز هفته نامعتبر است.");
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime || "") ||
            !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime || "") ||
            item.endTime <= item.startTime)
            errors.push("بازه زمانی نامعتبر است.");
        return errors;
    }
    async classroomForOrganization(classroomId, organizationId) {
        if (!classroomId)
            return null;
        const classroom = await this.classes.findOne({
            where: { id: classroomId, organization: { id: organizationId } },
        });
        if (!classroom)
            throw new api_exception_1.ApiException(422, "SCHEDULE_CLASS_OUTSIDE_ORGANIZATION", "کلاس انتخاب‌شده متعلق به این مدرسه نیست.");
        return classroom;
    }
    async teacherForOrganization(teacherId, organizationId) {
        if (!teacherId)
            return null;
        const membership = await this.memberships.findOne({
            where: {
                user: { id: teacherId },
                organization: { id: organizationId },
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            },
            relations: { user: true },
        });
        if (!membership?.user)
            throw new api_exception_1.ApiException(422, "SCHEDULE_TEACHER_OUTSIDE_ORGANIZATION", "استاد انتخاب‌شده عضو فعال این مدرسه نیست.");
        return membership.user;
    }
    async classBookForSession(classroom, teacher, classBookId) {
        if (!classroom) {
            if (classBookId)
                throw new api_exception_1.ApiException(422, "SCHEDULE_BOOK_REQUIRES_CLASS", "کتاب جلسه باید به یک کلاس متصل باشد.");
            return null;
        }
        if (!classBookId || !teacher)
            throw new api_exception_1.ApiException(422, "SCHEDULE_CLASS_BOOK_REQUIRED", "برای جلسهٔ کلاسی، کتاب و استاد مسئول را انتخاب کنید.");
        const classBook = await this.classBooks.findOne({
            where: { id: classBookId, classroom: { id: classroom.id }, teacher: { id: teacher.id } },
            relations: { book: true, teacher: true },
        });
        if (!classBook)
            throw new api_exception_1.ApiException(422, "SCHEDULE_BOOK_TEACHER_MISMATCH", "کتاب انتخاب‌شده به این کلاس و استاد واگذار نشده است.");
        return classBook;
    }
};
exports.ScheduleService = ScheduleService;
exports.ScheduleService = ScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_schedule_entry_entity_1.SchoolScheduleEntry)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(2, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(3, (0, typeorm_1.InjectRepository)(education_class_entity_1.EducationClass)),
    __param(4, (0, typeorm_1.InjectRepository)(education_class_book_entity_1.EducationClassBook)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService])
], ScheduleService);
//# sourceMappingURL=schedule.service.js.map