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
exports.ClassGroupsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const study_group_membership_entity_1 = require("../../database/entities/study-group-membership.entity");
const study_group_entity_1 = require("../../database/entities/study-group.entity");
const school_access_1 = require("../school-access");
const class_groups_dto_1 = require("./class-groups.dto");
let ClassGroupsService = class ClassGroupsService {
    classes;
    enrollments;
    groups;
    memberships;
    students;
    access;
    constructor(classes, enrollments, groups, memberships, students, access) {
        this.classes = classes;
        this.enrollments = enrollments;
        this.groups = groups;
        this.memberships = memberships;
        this.students = students;
        this.access = access;
    }
    async classOptions(user, organizationId) {
        this.requireCapability(user, "class_groups.read");
        if (organizationId)
            this.assertWorkOrganization(user, organizationId);
        const organizationIds = await this.access.scopedOrganizationIds(user, organizationId ?? user.activeOrganizationId);
        if (!organizationIds.length)
            return [];
        const classrooms = await this.classes.find({
            where: { organization: { id: (0, typeorm_2.In)(organizationIds) } },
            relations: {
                organization: true,
                advisor: true,
                books: { teacher: true },
                enrollments: true,
            },
            order: { name: "ASC" },
        });
        return classrooms
            .filter((classroom) => this.canReadGroup(user, { classroom }))
            .map((classroom) => ({
            id: classroom.id,
            code: classroom.code,
            name: classroom.name,
            status: classroom.status,
            organizationId: classroom.organization.id,
            organizationName: classroom.organization.name,
            enrollmentCount: classroom.enrollments.length,
        }));
    }
    async eligibleStudents(user, classId) {
        this.requireCapability(user, "class_groups.read");
        const classroom = await this.classes.findOne({
            where: { id: classId },
            relations: {
                organization: true,
                advisor: true,
                books: { teacher: true },
            },
        });
        if (!classroom)
            throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
        await this.access.organizationForUser(user, classroom.organization.id);
        this.assertWorkOrganization(user, classroom.organization.id);
        if (!this.canReadGroup(user, { classroom }))
            throw new api_exception_1.ApiException(403, "CLASS_GROUP_FORBIDDEN", "این کلاس به شما واگذار نشده است.");
        const enrolled = await this.enrollments.find({
            where: { classroom: { id: classroom.id } },
            relations: { student: { organization: true } },
            order: { student: { name: "ASC" } },
        });
        return enrolled
            .filter((row) => row.student.organization?.id === classroom.organization.id)
            .map((row) => ({
            id: row.student.id,
            name: row.student.name,
            grade: row.student.grade,
            major: row.student.major,
        }));
    }
    async list(user, classId, organizationId) {
        this.requireCapability(user, "class_groups.read");
        if (organizationId)
            this.assertWorkOrganization(user, organizationId);
        const organizationIds = await this.access.scopedOrganizationIds(user, organizationId ?? user.activeOrganizationId);
        if (!organizationIds.length)
            return [];
        const rows = await this.groups.find({
            where: classId
                ? {
                    classroom: { id: classId },
                    organization: { id: (0, typeorm_2.In)(organizationIds) },
                }
                : { organization: { id: (0, typeorm_2.In)(organizationIds) } },
            relations: {
                organization: true,
                classroom: { advisor: true, books: { teacher: true } },
                memberships: true,
            },
            order: { name: "ASC" },
        });
        return rows
            .filter((group) => this.canReadGroup(user, group))
            .map((group) => this.view(group));
    }
    async create(user, dto) {
        this.requireCapability(user, "class_groups.manage");
        const classroom = await this.classes.findOne({
            where: { id: dto.classId },
            relations: { organization: true },
        });
        if (!classroom)
            throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
        await this.access.organizationForUser(user, classroom.organization.id);
        this.assertWorkOrganization(user, classroom.organization.id);
        if (classroom.status !== "ACTIVE")
            throw new api_exception_1.ApiException(409, "CLASS_ARCHIVED", "برای کلاس بایگانی‌شده نمی‌توان گروه ساخت.");
        const code = dto.code.trim().toLowerCase();
        this.validateIdentity(dto.name.trim(), code);
        if (await this.groups.findOne({
            where: { organization: { id: classroom.organization.id }, code },
        }))
            throw new api_exception_1.ApiException(409, "CLASS_GROUP_CODE_EXISTS", "این کد گروه در مدرسه تکراری است.");
        try {
            const group = await this.groups.save(this.groups.create({
                organization: classroom.organization,
                classroom,
                code,
                name: dto.name.trim(),
                description: dto.description?.trim() || "",
                status: "ACTIVE",
            }));
            return this.view(await this.requireGroup(user, group.id));
        }
        catch (error) {
            this.rethrowCodeConflict(error);
        }
    }
    async update(user, id, dto) {
        this.requireCapability(user, "class_groups.manage");
        const group = await this.requireGroup(user, id);
        this.assertMutable(group);
        const code = dto.code?.trim().toLowerCase() ?? group.code;
        const name = dto.name?.trim() ?? group.name;
        this.validateIdentity(name, code);
        const duplicate = await this.groups.findOne({
            where: { organization: { id: group.organization.id }, code },
        });
        if (duplicate && duplicate.id !== group.id)
            throw new api_exception_1.ApiException(409, "CLASS_GROUP_CODE_EXISTS", "این کد گروه در مدرسه تکراری است.");
        group.name = name;
        group.code = code;
        if (dto.description !== undefined)
            group.description = dto.description.trim();
        try {
            return this.view(await this.groups.save(group));
        }
        catch (error) {
            this.rethrowCodeConflict(error);
        }
    }
    async members(user, id) {
        this.requireCapability(user, "class_groups.read");
        const group = await this.requireGroup(user, id);
        const rows = await this.memberships.find({
            where: { group: { id: group.id } },
            relations: { student: { user: true } },
            order: { createdAt: "ASC" },
        });
        return rows.map((row) => ({
            id: row.student.id,
            name: row.student.name,
            nationalCode: row.student.nationalCode ?? null,
            userId: row.student.user?.id ?? null,
        }));
    }
    async setMembers(user, id, studentIds) {
        this.requireCapability(user, "class_groups.manage");
        const group = await this.requireGroup(user, id);
        this.assertMutable(group);
        if (studentIds.length > class_groups_dto_1.MAX_CLASS_GROUP_MEMBERS)
            throw new api_exception_1.ApiException(422, "CLASS_GROUP_TOO_MANY_MEMBERS", "تعداد اعضای گروه بیش از حد مجاز است.");
        const uniqueIds = [...new Set(studentIds)];
        return this.memberships.manager.transaction(async (manager) => {
            const enrolled = await manager
                .getRepository(education_class_enrollment_entity_1.EducationClassEnrollment)
                .find({
                where: { classroom: { id: group.classroom.id } },
                relations: { student: { organization: true } },
            });
            const allowed = new Map(enrolled
                .filter((row) => row.student.organization?.id === group.organization.id)
                .map((row) => [row.student.id, row.student]));
            if (uniqueIds.some((studentId) => !allowed.has(studentId)))
                throw new api_exception_1.ApiException(422, "CLASS_GROUP_MEMBER_NOT_ENROLLED", "همه اعضای گروه باید ابتدا عضو همین کلاس و سازمان باشند.");
            const memberships = manager.getRepository(study_group_membership_entity_1.StudyGroupMembership);
            await memberships.delete({ group: { id: group.id } });
            if (uniqueIds.length)
                await memberships.save(uniqueIds.map((studentId) => memberships.create({ group, student: allowed.get(studentId) })));
            return { groupId: group.id, count: uniqueIds.length };
        });
    }
    async remove(user, id) {
        this.requireCapability(user, "class_groups.manage");
        const group = await this.requireGroup(user, id);
        await this.groups.remove(group);
        return { deleted: true };
    }
    async requireGroup(user, id) {
        const group = await this.groups.findOne({
            where: { id },
            relations: {
                organization: true,
                classroom: { advisor: true, books: { teacher: true } },
                memberships: true,
            },
        });
        if (!group)
            throw new api_exception_1.ApiException(404, "CLASS_GROUP_NOT_FOUND", "گروه کلاس پیدا نشد.");
        await this.access.organizationForUser(user, group.organization.id);
        this.assertWorkOrganization(user, group.organization.id);
        if (!this.canReadGroup(user, group))
            throw new api_exception_1.ApiException(403, "CLASS_GROUP_FORBIDDEN", "این کلاس به شما واگذار نشده است.");
        return group;
    }
    requireCapability(user, capability) {
        if (!user.capabilities?.includes(capability))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    }
    assertWorkOrganization(user, organizationId) {
        if (user.activeOrganizationId &&
            user.activeOrganizationId !== organizationId)
            throw new api_exception_1.ApiException(403, "CLASS_GROUP_WORK_CONTEXT_MISMATCH", "ابتدا سازمان فعال را تغییر دهید.");
    }
    canReadGroup(user, group) {
        return (this.access.isPlatform(user) ||
            ["class_groups.manage", "students.read.all", "classes.manage"].some((capability) => user.capabilities?.includes(capability)) ||
            group.classroom?.advisor?.id === user.id ||
            Boolean(group.classroom?.books?.some((book) => book.teacher?.id === user.id)));
    }
    assertMutable(group) {
        if (!group.classroom)
            throw new api_exception_1.ApiException(409, "CLASS_GROUP_CLASS_REQUIRED", "این گروه هنوز به کلاس متصل نشده است.");
        if (group.status !== "ACTIVE" || group.classroom.status !== "ACTIVE")
            throw new api_exception_1.ApiException(409, "CLASS_GROUP_ARCHIVED", "اعضای کلاس یا گروه بایگانی‌شده قابل تغییر نیستند.");
    }
    validateIdentity(name, code) {
        if (!name || !code)
            throw new api_exception_1.ApiException(422, "CLASS_GROUP_INVALID_IDENTITY", "نام و کد گروه الزامی است.");
    }
    rethrowCodeConflict(error) {
        if (error instanceof Error &&
            error.message.includes("UNIQUE constraint failed") &&
            error.message.includes("study_groups"))
            throw new api_exception_1.ApiException(409, "CLASS_GROUP_CODE_EXISTS", "این کد گروه در مدرسه تکراری است.");
        throw error;
    }
    view(group) {
        return {
            id: group.id,
            code: group.code,
            name: group.name,
            description: group.description,
            status: group.status,
            organizationId: group.organization.id,
            classId: group.classroom?.id ?? null,
            className: group.classroom?.name ?? null,
            memberCount: group.memberships?.length ?? 0,
        };
    }
};
exports.ClassGroupsService = ClassGroupsService;
exports.ClassGroupsService = ClassGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(education_class_entity_1.EducationClass)),
    __param(1, (0, typeorm_1.InjectRepository)(education_class_enrollment_entity_1.EducationClassEnrollment)),
    __param(2, (0, typeorm_1.InjectRepository)(study_group_entity_1.StudyGroup)),
    __param(3, (0, typeorm_1.InjectRepository)(study_group_membership_entity_1.StudyGroupMembership)),
    __param(4, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        school_access_1.SchoolAccessService])
], ClassGroupsService);
//# sourceMappingURL=class-groups.service.js.map