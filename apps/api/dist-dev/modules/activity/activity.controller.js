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
exports.ActivityController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const activity_service_1 = require("./activity.service");
let ActivityController = class ActivityController {
    activity;
    constructor(activity) {
        this.activity = activity;
    }
    context(u) {
        return {
            ...u,
            roles: u.roles || [u.role],
            capabilities: u.capabilities || [],
            membershipIds: u.membershipIds || [],
            organizationIds: u.organizationIds || [],
        };
    }
    heartbeat(u, b) {
        return this.activity.heartbeat(u.id, b).then(envelope_1.ok);
    }
    record(u, b) {
        return this.activity.record(u.id, b).then(envelope_1.ok);
    }
    syncHealth(u, b) { return this.activity.reportSyncHealth(u.id, b).then(envelope_1.ok); }
    syncHealthForStudent(u, id) { return this.activity.syncHealth(this.context(u), id).then(envelope_1.ok); }
    reviewSyncHealth(u, id) { return this.activity.reviewSyncHealth(this.context(u), id).then(envelope_1.ok); }
    history(u, id, limit) {
        return this.activity
            .history(this.context(u), id, Number(limit || 50))
            .then(envelope_1.ok);
    }
    live(u) {
        return this.activity.live(this.context(u)).then(envelope_1.ok);
    }
    attention(u) {
        return this.activity.attentionList(this.context(u)).then(envelope_1.ok);
    }
};
exports.ActivityController = ActivityController;
__decorate([
    (0, common_1.Put)("student/presence/heartbeat"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)("student/activity"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "record", null);
__decorate([
    (0, common_1.Put)("student/sync-health"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "syncHealth", null);
__decorate([
    (0, common_1.Get)("students/:id/sync-health"),
    (0, capabilities_decorator_1.RequireCapabilities)("student.activity.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "syncHealthForStudent", null);
__decorate([
    (0, common_1.Post)("students/:id/sync-health/review"),
    (0, capabilities_decorator_1.RequireCapabilities)("student.sync.support"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "reviewSyncHealth", null);
__decorate([
    openapi.ApiQuery({ name: "limit", required: false }),
    (0, common_1.Get)("students/:id/activity"),
    (0, capabilities_decorator_1.RequireCapabilities)("student.activity.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "history", null);
__decorate([
    (0, common_1.Get)("live"),
    (0, capabilities_decorator_1.RequireCapabilities)("student.live.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "live", null);
__decorate([
    (0, common_1.Get)("attention"),
    (0, capabilities_decorator_1.RequireCapabilities)("student.live.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "attention", null);
exports.ActivityController = ActivityController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [activity_service_1.ActivityService])
], ActivityController);
//# sourceMappingURL=activity.controller.js.map