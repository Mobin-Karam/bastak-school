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
exports.StudentAdministrationController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const student_admin_dto_1 = require("./dto/student-admin.dto");
const student_administration_service_1 = require("./student-administration.service");
const learning_dto_1 = require("./dto/learning.dto");
const task_issue_dto_1 = require("./dto/task-issue.dto");
let StudentAdministrationController = class StudentAdministrationController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(u, organizationId) { return this.service.list(u, organizationId).then(envelope_1.ok); }
    create(u, d) { return this.service.create(u, d).then(envelope_1.ok); }
    get(u, id) { return this.service.get(u, id).then(envelope_1.ok); }
    overview(u, id) { return this.service.get(u, id).then(envelope_1.ok); }
    profile(u, id) { return this.service.profile(u, id).then(envelope_1.ok); }
    updateProfile(u, id, d) { return this.service.updateProfile(u, id, d).then(envelope_1.ok); }
    update(u, id, d) { return this.service.update(u, id, d).then(envelope_1.ok); }
    remove(u, id) { return this.service.remove(u, id).then(envelope_1.ok); }
    activate(u, id) { return this.service.lifecycle(u, id, "activate").then(envelope_1.ok); }
    deactivate(u, id) { return this.service.lifecycle(u, id, "deactivate").then(envelope_1.ok); }
    restore(u, id) { return this.service.lifecycle(u, id, "restore").then(envelope_1.ok); }
    forceLogout(u, id) { return this.service.lifecycle(u, id, "force-logout").then(envelope_1.ok); }
    reset(u, id, d) { return this.service.resetPassword(u, id, d.password).then(envelope_1.ok); }
    learning(u, id) { return this.service.learning(u, id).then(envelope_1.ok); }
    createLearning(u, id, d) { return this.service.createLearning(u, id, d).then(envelope_1.ok); }
    updateLearning(u, id, itemId, d) { return this.service.updateLearning(u, id, itemId, d).then(envelope_1.ok); }
    deleteLearning(u, id, itemId) { return this.service.deleteLearning(u, id, itemId).then(envelope_1.ok); }
    reviewLearning(u, id, itemId, d) { return this.service.reviewLearning(u, id, itemId, d.rating).then(envelope_1.ok); }
    history(u, id, itemId) { return this.service.learningHistory(u, id, itemId).then(envelope_1.ok); }
    weekly(u, id) { return this.service.weekly(u, id).then(envelope_1.ok); }
    topics(u, id) { return this.service.topics(u, id).then(envelope_1.ok); }
    inbox(u, id) { return this.service.advisorInbox(u, id).then(envelope_1.ok); }
    updateIssue(u, id, d) { return this.service.updateTaskIssue(u, id, d).then(envelope_1.ok); }
};
exports.StudentAdministrationController = StudentAdministrationController;
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)(),
    (0, capabilities_decorator_1.RequireCapabilities)("students.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, capabilities_decorator_1.RequireCapabilities)("students.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, student_admin_dto_1.CreateStudentDto]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "get", null);
__decorate([
    (0, common_1.Get)(":id/overview"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)(":id/profile"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "profile", null);
__decorate([
    (0, common_1.Patch)(":id/profile"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, student_admin_dto_1.UpdateStudentDto]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, student_admin_dto_1.UpdateStudentDto]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.archive"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/activate"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.update"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(":id/deactivate"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.update"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(":id/restore"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.update"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(":id/force-logout"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.update"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "forceLogout", null);
__decorate([
    (0, common_1.Post)(":id/reset-password"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.update"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, student_admin_dto_1.ResetStudentPasswordDto]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "reset", null);
__decorate([
    (0, common_1.Get)(":id/learning"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "learning", null);
__decorate([
    (0, common_1.Post)(":id/learning"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, learning_dto_1.CreateLearningItemDto]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "createLearning", null);
__decorate([
    (0, common_1.Patch)(":id/learning/:itemId"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("itemId")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, learning_dto_1.UpdateLearningItemDto]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "updateLearning", null);
__decorate([
    (0, common_1.Delete)(":id/learning/:itemId"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("itemId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "deleteLearning", null);
__decorate([
    (0, common_1.Post)(":id/learning/:itemId/review"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.review"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("itemId")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, learning_dto_1.ReviewLearningItemDto]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "reviewLearning", null);
__decorate([
    (0, common_1.Get)(":id/learning/:itemId/reviews"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("itemId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "history", null);
__decorate([
    (0, common_1.Get)(":id/progress/weekly"),
    (0, capabilities_decorator_1.RequireCapabilities)("student.progress.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "weekly", null);
__decorate([
    (0, common_1.Get)(":id/performance/topics"),
    (0, capabilities_decorator_1.RequireCapabilities)("student.progress.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "topics", null);
__decorate([
    (0, common_1.Get)(":id/advisor-inbox"),
    (0, capabilities_decorator_1.RequireCapabilities)("students.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "inbox", null);
__decorate([
    (0, common_1.Patch)("task-issues/:issueId"),
    (0, capabilities_decorator_1.RequireCapabilities)("tasks.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("issueId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, task_issue_dto_1.UpdateTaskIssueDto]),
    __metadata("design:returntype", void 0)
], StudentAdministrationController.prototype, "updateIssue", null);
exports.StudentAdministrationController = StudentAdministrationController = __decorate([
    (0, common_1.Controller)("students"),
    __metadata("design:paramtypes", [student_administration_service_1.StudentAdministrationService])
], StudentAdministrationController);
//# sourceMappingURL=student-administration.controller.js.map