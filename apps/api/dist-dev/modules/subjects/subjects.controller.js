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
exports.SubjectsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const subject_dto_1 = require("./subject.dto");
const subjects_service_1 = require("./subjects.service");
let SubjectsController = class SubjectsController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(u, includeArchived) {
        return this.service.list(u, includeArchived === "true").then(envelope_1.ok);
    }
    create(u, d) {
        return this.service.create(u, d).then(envelope_1.ok);
    }
    export(u) {
        return this.service.export(u).then(envelope_1.ok);
    }
    sample() {
        return (0, envelope_1.ok)(this.service.importSample());
    }
    previewImport(u, d) {
        return this.service.previewImport(u, d.subjects).then(envelope_1.ok);
    }
    commitImport(u, d) {
        return this.service.commitImport(u, d.subjects).then(envelope_1.ok);
    }
    update(u, id, d) {
        return this.service.update(u, id, d).then(envelope_1.ok);
    }
    archive(u, id, d) {
        return this.service.setActive(u, id, d.active).then(envelope_1.ok);
    }
    assignTeacher(u, id, d) {
        return this.service.assignTeacher(u, id, d).then(envelope_1.ok);
    }
    teachers(u, id, organizationId) {
        return this.service.listTeachers(u, id, organizationId).then(envelope_1.ok);
    }
    unassignTeacher(u, id, teacherId, organizationId) {
        return this.service
            .unassignTeacher(u, id, teacherId, organizationId)
            .then(envelope_1.ok);
    }
    forStudent(u, id) {
        return this.service.forStudent(u, id).then(envelope_1.ok);
    }
    configure(u, studentId, subjectId, d) {
        return this.service.configure(u, studentId, subjectId, d).then(envelope_1.ok);
    }
};
exports.SubjectsController = SubjectsController;
__decorate([
    openapi.ApiQuery({ name: "includeArchived", required: false }),
    (0, common_1.Get)("subjects"),
    (0, capabilities_decorator_1.RequireCapabilities)("subjects.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("includeArchived")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("subjects"),
    (0, capabilities_decorator_1.RequireCapabilities)("subjects.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subject_dto_1.CreateSubjectDto]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("subjects/export"),
    (0, capabilities_decorator_1.RequireCapabilities)("subjects.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "export", null);
__decorate([
    (0, common_1.Get)("subjects/import-sample"),
    (0, capabilities_decorator_1.RequireCapabilities)("subjects.create"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "sample", null);
__decorate([
    (0, common_1.Post)("subjects/import-preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("subjects.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subject_dto_1.ImportSubjectsDto]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "previewImport", null);
__decorate([
    (0, common_1.Post)("subjects/import-commit"),
    (0, capabilities_decorator_1.RequireCapabilities)("subjects.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, subject_dto_1.ImportSubjectsDto]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "commitImport", null);
__decorate([
    (0, common_1.Patch)("subjects/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("subjects.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, subject_dto_1.UpdateSubjectDto]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)("subjects/:id/archive"),
    (0, capabilities_decorator_1.RequireCapabilities)("subjects.archive"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, subject_dto_1.ArchiveSubjectDto]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "archive", null);
__decorate([
    (0, common_1.Post)("subjects/:id/teachers"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.members.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, subject_dto_1.AssignTeacherSubjectDto]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "assignTeacher", null);
__decorate([
    (0, common_1.Get)("subjects/:id/teachers"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.members.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "teachers", null);
__decorate([
    (0, common_1.Delete)("subjects/:id/teachers/:teacherId"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.members.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("teacherId")),
    __param(3, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "unassignTeacher", null);
__decorate([
    (0, common_1.Get)("students/:studentId/subjects"),
    (0, capabilities_decorator_1.RequireCapabilities)("studentSubjects.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "forStudent", null);
__decorate([
    (0, common_1.Patch)("students/:studentId/subjects/:subjectId"),
    (0, capabilities_decorator_1.RequireCapabilities)("studentSubjects.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("studentId")),
    __param(2, (0, common_1.Param)("subjectId")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, subject_dto_1.UpdateStudentSubjectDto]),
    __metadata("design:returntype", void 0)
], SubjectsController.prototype, "configure", null);
exports.SubjectsController = SubjectsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [subjects_service_1.SubjectsService])
], SubjectsController);
//# sourceMappingURL=subjects.controller.js.map