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
exports.LearningResourcesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const learning_resource_entity_1 = require("../../database/entities/learning-resource.entity");
const learning_resource_assignment_entity_1 = require("../../database/entities/learning-resource-assignment.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const authorization_1 = require("../authorization");
const realtime_service_1 = require("../realtime/realtime.service");
let LearningResourcesService = class LearningResourcesService {
    resources;
    assignments;
    students;
    authorization;
    realtime;
    constructor(resources, assignments, students, authorization, realtime) {
        this.resources = resources;
        this.assignments = assignments;
        this.students = students;
        this.authorization = authorization;
        this.realtime = realtime;
    }
    async listManaged(actor) {
        const rows = await this.resources.find({
            relations: { assignments: { student: true }, createdBy: true },
            order: { updatedAt: "DESC" },
        });
        if (this.isPlatformAdmin(actor))
            return rows;
        const visible = await Promise.all(rows.map(async (resource) => resource.createdBy.id === actor.id ||
            this.canAccessEveryStudent(actor, resource.assignments.map((item) => item.student.id))));
        return rows.filter((_, index) => visible[index]);
    }
    async listAssignableStudents(actor) {
        const rows = await this.students.find({ order: { name: "ASC" } });
        const visible = this.isPlatformAdmin(actor)
            ? rows
            : (await Promise.all(rows.map(async (student) => ({
                student,
                allowed: await this.authorization.canAccessStudent(this.context(actor), student.id, "learning_resources.manage"),
            }))))
                .filter((entry) => entry.allowed)
                .map((entry) => entry.student);
        return visible.map(({ id, name, grade, major, gradeId, educationTypeId, trackId, learnerProfile, independentType, accountStatus, }) => ({
            id,
            name,
            grade,
            major,
            gradeId,
            educationTypeId,
            trackId,
            learnerProfile,
            independentType,
            accountStatus,
        }));
    }
    async listForStudent(actor, studentId) {
        let target = studentId;
        if (!target)
            target = (await this.students.findOne({
                where: { user: { id: actor.id } },
                relations: { user: true },
            }))?.id;
        if (!target)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        if (!(await this.authorization.canAccessStudent(this.context(actor), target, "learning_resources.read")))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
        return this.assignments
            .find({
            where: { student: { id: target }, resource: { status: "PUBLISHED" } },
            relations: { resource: true },
            order: { assignedAt: "DESC" },
        })
            .then((rows) => rows.map((row) => row.resource));
    }
    async create(actor, dto) {
        await this.requireStudentScope(actor, dto.studentIds);
        const resource = await this.resources.save(this.resources.create({
            ...this.clean(dto),
            createdBy: { id: actor.id },
        }));
        await this.replaceAssignments(resource, dto.studentIds);
        if (resource.status === "PUBLISHED")
            await this.emitChange(dto.studentIds, resource.id, "assigned");
        return this.find(resource.id);
    }
    async update(actor, id, dto) {
        const resource = await this.requireManageAccess(actor, id);
        await this.requireStudentScope(actor, dto.studentIds);
        Object.assign(resource, this.clean(dto));
        await this.resources.save(resource);
        await this.replaceAssignments(resource, dto.studentIds);
        if (resource.status === "PUBLISHED")
            await this.emitChange(dto.studentIds, resource.id, "updated");
        return this.find(id);
    }
    async remove(actor, id) {
        const resource = await this.requireManageAccess(actor, id);
        const studentIds = resource.assignments.map((item) => item.student.id);
        await this.resources.remove(resource);
        await this.emitChange(studentIds, id, "removed");
        return { deleted: true };
    }
    find(id) {
        return this.resources.findOneOrFail({
            where: { id },
            relations: { assignments: { student: true }, createdBy: true },
        });
    }
    async findEntity(id) {
        const value = await this.resources.findOne({ where: { id } });
        if (!value)
            throw new api_exception_1.ApiException(404, "LEARNING_RESOURCE_NOT_FOUND", "محتوا پیدا نشد.");
        return value;
    }
    clean(dto) {
        const url = new URL(dto.url);
        if (url.protocol !== "https:")
            throw new api_exception_1.ApiException(400, "INVALID_URL", "پیوند باید امن باشد.");
        return {
            title: dto.title.trim(),
            description: dto.description?.trim() || "",
            type: dto.type,
            category: dto.category?.trim() || "عمومی",
            url: url.toString(),
            status: dto.status || "PUBLISHED",
        };
    }
    async replaceAssignments(resource, ids) {
        const students = ids.length
            ? await this.students.findBy({ id: (0, typeorm_2.In)(ids) })
            : [];
        if (students.length !== ids.length)
            throw new api_exception_1.ApiException(400, "INVALID_STUDENTS", "یک یا چند دانش‌آموز معتبر نیستند.");
        await this.assignments.delete({ resource: { id: resource.id } });
        if (students.length)
            await this.assignments.save(students.map((student) => this.assignments.create({ resource, student })));
    }
    async emitChange(studentIds, resourceId, action) {
        if (!studentIds.length)
            return;
        const students = await this.students.find({
            where: { id: (0, typeorm_2.In)([...new Set(studentIds)]) },
            relations: { user: true },
        });
        this.realtime.emitToUsers(students.flatMap((student) => student.user?.id ? [student.user.id] : []), "learning-resource.updated", { resourceId, action });
    }
    context(actor) {
        return {
            ...actor,
            roles: actor.roles || [actor.role],
            capabilities: actor.capabilities || [],
            membershipIds: actor.membershipIds || [],
            organizationIds: actor.organizationIds || [],
        };
    }
    isPlatformAdmin(actor) {
        return (actor.roles || [actor.role]).includes("PLATFORM_ADMIN");
    }
    async canAccessEveryStudent(actor, ids) {
        return (ids.length > 0 &&
            (await Promise.all(ids.map((id) => this.authorization.canAccessStudent(this.context(actor), id, "learning_resources.manage")))).every(Boolean));
    }
    async requireStudentScope(actor, ids) {
        if (!ids.length)
            return;
        if (!(await this.canAccessEveryStudent(actor, ids)))
            throw new api_exception_1.ApiException(403, "STUDENT_SCOPE_FORBIDDEN", "یک یا چند دانش‌آموز خارج از محدوده دسترسی شما هستند.");
    }
    async requireManageAccess(actor, id) {
        const resource = await this.resources.findOne({
            where: { id },
            relations: { assignments: { student: true }, createdBy: true },
        });
        if (!resource)
            throw new api_exception_1.ApiException(404, "LEARNING_RESOURCE_NOT_FOUND", "محتوا پیدا نشد.");
        if (!this.isPlatformAdmin(actor) &&
            resource.createdBy.id !== actor.id &&
            !(await this.canAccessEveryStudent(actor, resource.assignments.map((item) => item.student.id))))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
        return resource;
    }
};
exports.LearningResourcesService = LearningResourcesService;
exports.LearningResourcesService = LearningResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(learning_resource_entity_1.LearningResource)),
    __param(1, (0, typeorm_1.InjectRepository)(learning_resource_assignment_entity_1.LearningResourceAssignment)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService,
        realtime_service_1.RealtimeService])
], LearningResourcesService);
//# sourceMappingURL=learning-resources.service.js.map