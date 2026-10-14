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
exports.AcademicController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const academic_service_1 = require("./academic.service");
const academic_dto_1 = require("./academic.dto");
let AcademicController = class AcademicController {
    academic;
    constructor(academic) {
        this.academic = academic;
    }
    subjects(u, org, page) {
        return this.academic.subjects(u, org, page).then(envelope_1.ok);
    }
    createSubject(u, org, dto) {
        return this.academic.createSubject(u, org, dto).then(envelope_1.ok);
    }
    teachers(u, org, page) {
        return this.academic.teachers(u, org, page).then(envelope_1.ok);
    }
    assignments(u, org, page) {
        return this.academic.assignments(u, org, page).then(envelope_1.ok);
    }
    create(u, org, dto) {
        return this.academic.createAssignment(u, org, dto).then(envelope_1.ok);
    }
    end(u, org, id, dto) {
        return this.academic.endAssignment(u, org, id, dto).then(envelope_1.ok);
    }
    references(u, org, page) {
        return this.academic.references(u, org, page).then(envelope_1.ok);
    }
    reference(u, org, dto) {
        return this.academic.reference(u, org, dto).then(envelope_1.ok);
    }
};
exports.AcademicController = AcademicController;
__decorate([
    (0, common_1.Get)("subjects"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, academic_dto_1.AcademicPageDto]),
    __metadata("design:returntype", void 0)
], AcademicController.prototype, "subjects", null);
__decorate([
    (0, common_1.Post)("subjects"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, academic_dto_1.AcademicSubjectDto]),
    __metadata("design:returntype", void 0)
], AcademicController.prototype, "createSubject", null);
__decorate([
    (0, common_1.Get)("teachers"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, academic_dto_1.AcademicPageDto]),
    __metadata("design:returntype", void 0)
], AcademicController.prototype, "teachers", null);
__decorate([
    (0, common_1.Get)("teaching-assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, academic_dto_1.AcademicPageDto]),
    __metadata("design:returntype", void 0)
], AcademicController.prototype, "assignments", null);
__decorate([
    (0, common_1.Post)("teaching-assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, academic_dto_1.TeachingAssignmentDto]),
    __metadata("design:returntype", void 0)
], AcademicController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)("teaching-assignments/:id/end"),
    (0, capabilities_decorator_1.RequireCapabilities)("classes.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, academic_dto_1.EndTeachingAssignmentDto]),
    __metadata("design:returntype", void 0)
], AcademicController.prototype, "end", null);
__decorate([
    (0, common_1.Get)("subject-books"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, academic_dto_1.AcademicPageDto]),
    __metadata("design:returntype", void 0)
], AcademicController.prototype, "references", null);
__decorate([
    (0, common_1.Post)("subject-books"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.catalog.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, academic_dto_1.SubjectBookReferenceDto]),
    __metadata("design:returntype", void 0)
], AcademicController.prototype, "reference", null);
exports.AcademicController = AcademicController = __decorate([
    (0, common_1.Controller)("school-education/:organizationId"),
    __metadata("design:paramtypes", [academic_service_1.AcademicService])
], AcademicController);
//# sourceMappingURL=academic.controller.js.map