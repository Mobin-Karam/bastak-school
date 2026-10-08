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
exports.LegacyDashboardController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const dashboard_service_1 = require("./dashboard.service");
let LegacyDashboardController = class LegacyDashboardController {
    dashboard;
    constructor(dashboard) {
        this.dashboard = dashboard;
    }
    get(user, context) {
        return this.dashboard.get(user, context).then(envelope_1.ok);
    }
    attention(user, limit) {
        return this.dashboard.attentionQueue(user, Number(limit)).then(envelope_1.ok);
    }
};
exports.LegacyDashboardController = LegacyDashboardController;
__decorate([
    openapi.ApiQuery({ name: "context", required: false }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("context")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LegacyDashboardController.prototype, "get", null);
__decorate([
    openapi.ApiOperation({ summary: "A read-only operational queue. Each source is included only when the\nactive work context has its existing capability; item-level student scope\nis checked again by the service before a record is returned." }),
    openapi.ApiQuery({ name: "limit", required: false }),
    (0, common_1.Get)("attention"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], LegacyDashboardController.prototype, "attention", null);
exports.LegacyDashboardController = LegacyDashboardController = __decorate([
    (0, common_1.Controller)("archive/dashboard"),
    __metadata("design:paramtypes", [dashboard_service_1.LegacyDashboardService])
], LegacyDashboardController);
//# sourceMappingURL=dashboard.controller.js.map