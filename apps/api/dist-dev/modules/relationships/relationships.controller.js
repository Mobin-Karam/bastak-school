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
exports.RelationshipsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const relationship_dto_1 = require("./dto/relationship.dto");
const relationships_service_1 = require("./relationships.service");
let RelationshipsController = class RelationshipsController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(user) { return this.service.list(user).then(envelope_1.ok); }
    create(user, dto) { return this.service.create(user, dto).then(envelope_1.ok); }
    get(user, id) { return this.service.get(user, id).then(envelope_1.ok); }
    update(user, id, dto) { return this.service.update(user, id, dto).then(envelope_1.ok); }
    remove(user, id) { return this.service.remove(user, id).then(envelope_1.ok); }
    accept(user, id) { return this.service.update(user, id, { status: "ACTIVE" }).then(envelope_1.ok); }
    reject(user, id) { return this.service.update(user, id, { status: "REJECTED" }).then(envelope_1.ok); }
    forStudent(user, id) { return this.service.forStudent(user, id).then(envelope_1.ok); }
    mine(user) { return this.service.myStudents(user).then(envelope_1.ok); }
    guardianSelection(user) { return this.service.guardianSelection(user).then(envelope_1.ok); }
    guardianCandidates(user, search) { return this.service.guardianCandidates(user, search).then(envelope_1.ok); }
    requestGuardian(user, guardianUserId) { return this.service.requestGuardian(user, guardianUserId).then(envelope_1.ok); }
    cancelGuardian(user, id) { return this.service.cancelGuardianRequest(user, id).then(envelope_1.ok); }
    allowGuardianChange(user, studentId) { return this.service.allowGuardianChange(user, studentId).then(envelope_1.ok); }
};
exports.RelationshipsController = RelationshipsController;
__decorate([
    (0, common_1.Get)("relationships"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("relationships"),
    (0, capabilities_decorator_1.RequireCapabilities)("relationships.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, relationship_dto_1.CreateRelationshipDto]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("relationships/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)("relationships/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, relationship_dto_1.UpdateRelationshipDto]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)("relationships/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)("relationships/:id/accept"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)("relationships/:id/reject"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)("students/:studentId/relationships"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "forStudent", null);
__decorate([
    (0, common_1.Get)("me/students"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "mine", null);
__decorate([
    (0, common_1.Get)("student/guardian-selection"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "guardianSelection", null);
__decorate([
    openapi.ApiQuery({ name: "search", required: false }),
    (0, common_1.Get)("student/guardian-candidates"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "guardianCandidates", null);
__decorate([
    (0, common_1.Post)("student/guardian-selection"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)("guardianUserId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "requestGuardian", null);
__decorate([
    (0, common_1.Delete)("student/guardian-selection/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "cancelGuardian", null);
__decorate([
    (0, common_1.Post)("students/:studentId/guardian-change-override"),
    (0, capabilities_decorator_1.RequireCapabilities)("system.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelationshipsController.prototype, "allowGuardianChange", null);
exports.RelationshipsController = RelationshipsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [relationships_service_1.RelationshipsService])
], RelationshipsController);
//# sourceMappingURL=relationships.controller.js.map