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
exports.PushController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const notification_entity_1 = require("../../database/entities/notification.entity");
const notifications_service_1 = require("./notifications.service");
const push_service_1 = require("./push.service");
let PushController = class PushController {
    push;
    notifications;
    constructor(push, notifications) {
        this.push = push;
        this.notifications = notifications;
    }
    config() { return (0, envelope_1.ok)(this.push.config()); }
    status(u, endpoint) { return this.push.status(u.id, endpoint).then(envelope_1.ok); }
    subscribe(u, body, agent) { return this.push.subscribe(u.id, body, agent).then(envelope_1.ok); }
    unsubscribe(u, endpoint) { return this.push.unsubscribe(u.id, endpoint).then(envelope_1.ok); }
    preferences(u, body) { return this.push.setPreferences(u.id, body).then(envelope_1.ok); }
    async test(u) { const notification = await this.notifications.createForUser(u.id, { type: notification_entity_1.NotificationType.MESSAGE, category: "system", title: "اعلان آزمایشی", body: "ارسال اعلان با موفقیت آزمایش شد." }); return (0, envelope_1.ok)({ notificationId: notification.id, pushConfigured: this.push.enabled }); }
};
exports.PushController = PushController;
__decorate([
    (0, common_1.Get)("config"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PushController.prototype, "config", null);
__decorate([
    openapi.ApiQuery({ name: "endpoint", required: false }),
    (0, common_1.Get)("status"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("endpoint")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "status", null);
__decorate([
    (0, common_1.Post)("subscriptions"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)("user-agent")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "subscribe", null);
__decorate([
    openapi.ApiQuery({ name: "endpoint", required: false }),
    (0, common_1.Delete)("subscriptions"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("endpoint")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "unsubscribe", null);
__decorate([
    (0, common_1.Put)("preferences"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "preferences", null);
__decorate([
    (0, common_1.Post)("test"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "test", null);
exports.PushController = PushController = __decorate([
    (0, common_1.Controller)("push"),
    __metadata("design:paramtypes", [push_service_1.PushService, notifications_service_1.NotificationsService])
], PushController);
//# sourceMappingURL=push.controller.js.map