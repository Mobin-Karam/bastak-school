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
exports.LearningResourcesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const learning_resources_dto_1 = require("./learning-resources.dto");
const learning_resources_service_1 = require("./learning-resources.service");
let LearningResourcesController = class LearningResourcesController {
    service;
    constructor(service) {
        this.service = service;
    }
    assigned(user, studentId) { return this.service.listForStudent(user, studentId).then(envelope_1.ok); }
    assignableStudents(user) { return this.service.listAssignableStudents(user).then(envelope_1.ok); }
    list(user) { return this.service.listManaged(user).then(envelope_1.ok); }
    create(user, dto) { return this.service.create(user, dto).then(envelope_1.ok); }
    update(user, id, dto) { return this.service.update(user, id, dto).then(envelope_1.ok); }
    remove(user, id) { return this.service.remove(user, id).then(envelope_1.ok); }
};
exports.LearningResourcesController = LearningResourcesController;
__decorate([
    openapi.ApiQuery({ name: "studentId", required: false }),
    (0, common_1.Get)("assigned"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning_resources.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LearningResourcesController.prototype, "assigned", null);
__decorate([
    (0, common_1.Get)("assignable-students"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning_resources.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LearningResourcesController.prototype, "assignableStudents", null);
__decorate([
    (0, common_1.Get)(),
    (0, capabilities_decorator_1.RequireCapabilities)("learning_resources.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LearningResourcesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, capabilities_decorator_1.RequireCapabilities)("learning_resources.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, learning_resources_dto_1.SaveLearningResourceDto]),
    __metadata("design:returntype", void 0)
], LearningResourcesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning_resources.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, learning_resources_dto_1.SaveLearningResourceDto]),
    __metadata("design:returntype", void 0)
], LearningResourcesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("learning_resources.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LearningResourcesController.prototype, "remove", null);
exports.LearningResourcesController = LearningResourcesController = __decorate([
    (0, common_1.Controller)("learning-resources"),
    __metadata("design:paramtypes", [learning_resources_service_1.LearningResourcesService])
], LearningResourcesController);
//# sourceMappingURL=learning-resources.controller.js.map