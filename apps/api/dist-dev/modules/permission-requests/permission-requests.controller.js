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
exports.PermissionRequestsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const permission_request_entity_1 = require("../../database/entities/permission-request.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const api_exception_1 = require("../../common/exceptions/api.exception");
const permission_requests_service_1 = require("./permission-requests.service");
let PermissionRequestsController = class PermissionRequestsController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(user, body) { return this.service.create(user, body).then(envelope_1.ok); }
    mine(user) { return this.service.mine(user).then(envelope_1.ok); }
    list(user) { return this.service.list(user).then(envelope_1.ok); }
    decide(user, id, body) { if (body.status !== permission_request_entity_1.PermissionRequestStatus.APPROVED && body.status !== permission_request_entity_1.PermissionRequestStatus.REJECTED)
        throw new api_exception_1.ApiException(400, "INVALID_PERMISSION_REQUEST_STATUS", "وضعیت بررسی معتبر نیست."); return this.service.decide(user, id, body.status, body.supervisorNote).then(envelope_1.ok); }
};
exports.PermissionRequestsController = PermissionRequestsController;
__decorate([
    (0, common_1.Post)("student/permission-requests"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("permission_requests.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PermissionRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("student/permission-requests"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("permission_requests.create"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PermissionRequestsController.prototype, "mine", null);
__decorate([
    (0, common_1.Get)("permission-requests"),
    (0, capabilities_decorator_1.RequireCapabilities)("permission_requests.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PermissionRequestsController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)("permission-requests/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("permission_requests.review"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PermissionRequestsController.prototype, "decide", null);
exports.PermissionRequestsController = PermissionRequestsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [permission_requests_service_1.PermissionRequestsService])
], PermissionRequestsController);
//# sourceMappingURL=permission-requests.controller.js.map