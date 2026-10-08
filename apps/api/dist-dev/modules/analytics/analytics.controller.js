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
exports.AnalyticsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const recommendation_entity_1 = require("../../database/entities/recommendation.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analytics;
    constructor(analytics) {
        this.analytics = analytics;
    }
    c(u) { return { ...u, roles: u.roles || [u.role], capabilities: u.capabilities || [], membershipIds: u.membershipIds || [], organizationIds: u.organizationIds || [] }; }
    self(u) { return this.analytics.self(u.id).then(envelope_1.ok); }
    student(u, id) { return this.analytics.analytics(this.c(u), id).then(envelope_1.ok); }
    list(u, id) { return this.analytics.listRecommendations(this.c(u), id).then(envelope_1.ok); }
    create(u, id, b) { return this.analytics.createRecommendation(this.c(u), u.id, id, b).then(envelope_1.ok); }
    mine(u) { return this.analytics.selfRecommendations(u.id).then(envelope_1.ok); }
    act(u, id, status) { return this.analytics.act(u.id, id, status).then(envelope_1.ok); }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)("student/analytics"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "self", null);
__decorate([
    (0, common_1.Get)("students/:id/analytics"),
    (0, capabilities_decorator_1.RequireCapabilities)("analytics.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "student", null);
__decorate([
    (0, common_1.Get)("students/:id/recommendations"),
    (0, capabilities_decorator_1.RequireCapabilities)("recommendations.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("students/:id/recommendations"),
    (0, capabilities_decorator_1.RequireCapabilities)("recommendations.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("recommendations"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "mine", null);
__decorate([
    (0, common_1.Patch)("recommendations/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "act", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map