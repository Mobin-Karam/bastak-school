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
const school_access_service_1 = require("../school-access/school-access.service");
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
    async list(user, classId, organizationId) {
        const organizationIds = await this.access.scopedOrganizationIds(user, organizationId);
        if (!organizationIds.length)
            return [];
        const rows = await this.groups.find({
            where: classId
                ? { classroom: { id: classId }, organization: { id: (0, typeorm_2.In)(organizationIds) } }
                : { organization: { id: (0, typeorm_2.In)(organizationIds) } },
            relations: { organization: true, classroom: true, memberships: true },
            order: { name: "ASC" },
        });
        return rows.map((group) => this.view(group));
    }
    async create(user, dto) {
        const classroom = await this.classes.findOne({ where: { id: dto.classId }, relations: { organization: true } });
        if (!classroom)
            throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
        await this.access.organizationForUser(user, classroom.organization.id);
        const code = dto.code.trim().toLowerCase();
        if (await this.groups.findOne({ where: { organization: { id: classroom.organization.id }, code } }))
            throw new api_exception_1.ApiException(409, "CLASS_GROUP_CODE_EXISTS", "این کد گروه در مدرسه تکراری است.");
        const group = await this.groups.save(this.groups.create({
            organization: classroom.organization, classroom, code, name: dto.name.trim(), description: dto.description?.trim() || "", status: "ACTIVE",
        }));
        return this.view(await this.requireGroup(user, group.id));
    }
    async members(user, id) {
        const group = await this.requireGroup(user, id);
        const rows = await this.memberships.find({
            where: { group: { id: group.id } },
            relations: { student: { user: true } },
            order: { createdAt: "ASC" },
        });
        return rows.map((row) => ({ id: row.student.id, name: row.student.name, nationalCode: row.student.nationalCode, userId: row.student.user?.id ?? null }));
    }
    async setMembers(user, id, studentIds) {
        const group = await this.requireGroup(user, id);
        if (!group.classroom)
            throw new api_exception_1.ApiException(409, "CLASS_GROUP_CLASS_REQUIRED", "این گروه هنوز به کلاس متصل نشده است.");
        const uniqueIds = [...new Set(studentIds || [])];
        const enrolled = await this.enrollments.find({
            where: { classroom: { id: group.classroom.id } },
            relations: { student: true },
        });
        const allowed = new Set(enrolled.map((row) => row.student.id));
        if (uniqueIds.some((id) => !allowed.has(id)))
            throw new api_exception_1.ApiException(422, "CLASS_GROUP_MEMBER_NOT_ENROLLED", "همه اعضای گروه باید ابتدا عضو کلاس باشند.");
        const students = uniqueIds.length ? await this.students.find({ where: { id: (0, typeorm_2.In)(uniqueIds) } }) : [];
        await this.memberships.delete({ group: { id: group.id } });
        if (students.length)
            await this.memberships.save(students.map((student) => this.memberships.create({ group, student })));
        return { groupId: group.id, count: students.length };
    }
    async remove(user, id) {
        const group = await this.requireGroup(user, id);
        await this.groups.remove(group);
        return { deleted: true };
    }
    async requireGroup(user, id) {
        const group = await this.groups.findOne({
            where: { id },
            relations: { organization: true, classroom: true, memberships: true },
        });
        if (!group)
            throw new api_exception_1.ApiException(404, "CLASS_GROUP_NOT_FOUND", "گروه کلاس پیدا نشد.");
        await this.access.organizationForUser(user, group.organization.id);
        return group;
    }
    view(group) {
        return {
            id: group.id, code: group.code, name: group.name, description: group.description, status: group.status,
            organizationId: group.organization.id, classId: group.classroom?.id ?? null, className: group.classroom?.name ?? null, memberCount: group.memberships?.length ?? 0,
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
        school_access_service_1.SchoolAccessService])
], ClassGroupsService);
//# sourceMappingURL=class-groups.service.js.map