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
exports.WorkflowsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const workflows_service_1 = require("./workflows.service");
let WorkflowsController = class WorkflowsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async listStudentLeaveRequests(user, organizationId) {
        return (0, envelope_1.ok)(await this.service.listLeaveRequests(user, organizationId));
    }
    async createStudentLeaveRequest(user, body) {
        return (0, envelope_1.ok)(await this.service.createLeaveRequest(user, body));
    }
    async listLeaveRequests(user, organizationId) {
        return (0, envelope_1.ok)(await this.service.listLeaveRequests(user, organizationId));
    }
    async reviewLeaveRequest(user, id, body) {
        return (0, envelope_1.ok)(await this.service.reviewLeaveRequest(user, id, body));
    }
    async listStudentExitPermissions(user, organizationId) {
        return (0, envelope_1.ok)(await this.service.listExitPermissions(user, organizationId));
    }
    async createStudentExitPermission(user, body) {
        return (0, envelope_1.ok)(await this.service.createExitPermission(user, body));
    }
    async listExitPermissions(user, organizationId) {
        return (0, envelope_1.ok)(await this.service.listExitPermissions(user, organizationId));
    }
    async reviewExitPermission(user, id, body) {
        return (0, envelope_1.ok)(await this.service.reviewExitPermission(user, id, body));
    }
    requestReturn(user, id, body) {
        return this.service.requestExitReturn(user, id, body?.note).then(envelope_1.ok);
    }
    gateDeparture(user, body) {
        return this.service.recordGateDeparture(user, body).then(envelope_1.ok);
    }
    gateReturn(user, body) {
        return this.service.recordGateReturn(user, body).then(envelope_1.ok);
    }
    departure(user, id) {
        return this.service.recordExitMovement(user, id, "departure").then(envelope_1.ok);
    }
    return(user, id) {
        return this.service.recordExitMovement(user, id, "return").then(envelope_1.ok);
    }
    occupancy(user, organizationId) {
        return this.service.occupancy(user, organizationId).then(envelope_1.ok);
    }
    async listStudentLetters(user, organizationId) {
        return (0, envelope_1.ok)(await this.service.listLetters(user, organizationId));
    }
    async createStudentLetter(user, body) {
        return (0, envelope_1.ok)(await this.service.createLetter(user, body));
    }
    async listLetters(user, organizationId) {
        return (0, envelope_1.ok)(await this.service.listLetters(user, organizationId));
    }
    async reviewLetter(user, id, body) {
        return (0, envelope_1.ok)(await this.service.reviewLetter(user, id, body));
    }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("student/leave-requests"),
    (0, capabilities_decorator_1.RequireCapabilities)("leave.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "listStudentLeaveRequests", null);
__decorate([
    (0, common_1.Post)("student/leave-requests"),
    (0, capabilities_decorator_1.RequireCapabilities)("leave.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "createStudentLeaveRequest", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("leave-requests"),
    (0, capabilities_decorator_1.RequireCapabilities)("leave.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "listLeaveRequests", null);
__decorate([
    (0, common_1.Patch)("leave-requests/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("leave.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "reviewLeaveRequest", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("student/exit-permissions"),
    (0, capabilities_decorator_1.RequireCapabilities)("exit.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "listStudentExitPermissions", null);
__decorate([
    (0, common_1.Post)("student/exit-permissions"),
    (0, capabilities_decorator_1.RequireCapabilities)("exit.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "createStudentExitPermission", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("exit-permissions"),
    (0, capabilities_decorator_1.RequireCapabilities)("exit.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "listExitPermissions", null);
__decorate([
    (0, common_1.Patch)("exit-permissions/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("exit.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "reviewExitPermission", null);
__decorate([
    (0, common_1.Post)("student/exit-permissions/:id/return-request"),
    (0, capabilities_decorator_1.RequireCapabilities)("exit.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "requestReturn", null);
__decorate([
    openapi.ApiOperation({ summary: "Gate staff can issue an immediate, auditable exit for a student found by phone." }),
    (0, common_1.Post)("exit-permissions/gate-departure"),
    (0, capabilities_decorator_1.RequireCapabilities)("exit.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "gateDeparture", null);
__decorate([
    openapi.ApiOperation({ summary: "A physical gate check-in may be confirmed by phone without waiting on the app." }),
    (0, common_1.Post)("exit-permissions/gate-return"),
    (0, capabilities_decorator_1.RequireCapabilities)("exit.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "gateReturn", null);
__decorate([
    (0, common_1.Post)("exit-permissions/:id/departure"),
    (0, capabilities_decorator_1.RequireCapabilities)("exit.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "departure", null);
__decorate([
    (0, common_1.Post)("exit-permissions/:id/return"),
    (0, capabilities_decorator_1.RequireCapabilities)("exit.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "return", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("attendance/occupancy"),
    (0, capabilities_decorator_1.RequireCapabilities)("school.occupancy.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "occupancy", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("student/letters"),
    (0, capabilities_decorator_1.RequireCapabilities)("letters.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "listStudentLetters", null);
__decorate([
    (0, common_1.Post)("student/letters"),
    (0, capabilities_decorator_1.RequireCapabilities)("letters.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "createStudentLetter", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("letters"),
    (0, capabilities_decorator_1.RequireCapabilities)("letters.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "listLetters", null);
__decorate([
    (0, common_1.Patch)("letters/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("letters.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "reviewLetter", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map