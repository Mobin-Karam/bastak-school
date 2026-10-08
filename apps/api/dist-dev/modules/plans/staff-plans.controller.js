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
exports.StaffPlansController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const api_exception_1 = require("../../common/exceptions/api.exception");
const envelope_1 = require("../../common/utils/envelope");
const authorization_1 = require("../authorization");
const import_plan_dto_1 = require("./dto/import-plan.dto");
const plans_service_1 = require("./plans.service");
let StaffPlansController = class StaffPlansController {
    plans;
    authorization;
    constructor(plans, authorization) {
        this.plans = plans;
        this.authorization = authorization;
    }
    context(user) { return { ...user, roles: user.roles || [user.role], capabilities: user.capabilities || [], membershipIds: user.membershipIds || [], organizationIds: user.organizationIds || [] }; }
    async student(user, id, capability) { if (!await this.authorization.canAccessStudent(this.context(user), id, capability))
        throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد."); }
    async plan(user, id, capability) { await this.student(user, await this.plans.studentIdForPlan(id), capability); }
    async task(user, id, capability) { await this.student(user, await this.plans.studentIdForTask(id), capability); }
    async list(user, studentId, from, to, date) { await this.student(user, studentId, "plans.read"); const start = date || from || new Date().toISOString().slice(0, 10); return (0, envelope_1.ok)(await this.plans.list(studentId, start, date || to || start)); }
    async create(user, dto) { await this.student(user, dto.studentId, "plans.create"); return (0, envelope_1.ok)(await this.plans.upsertPlan(dto)); }
    async update(user, id, body) { await this.plan(user, id, "plans.update"); return (0, envelope_1.ok)(await this.plans.updatePlan(id, body)); }
    async remove(user, id) { await this.plan(user, id, "plans.delete"); return (0, envelope_1.ok)(await this.plans.deletePlan(id)); }
    async duplicate(user, id, date) { await this.plan(user, id, "plans.read"); return (0, envelope_1.ok)(await this.plans.duplicatePlan(id, date)); }
    async addTask(user, id, body) { await this.plan(user, id, "tasks.create"); return (0, envelope_1.ok)(await this.plans.addTask(id, body)); }
    async updateTask(user, id, body) { await this.task(user, id, "tasks.update"); if (body.planId)
        await this.plan(user, body.planId, "tasks.update"); return (0, envelope_1.ok)(await this.plans.updateTask(id, body)); }
    async removeTask(user, id) { await this.task(user, id, "tasks.delete"); return (0, envelope_1.ok)(await this.plans.deleteTask(id)); }
    async publish(user, body) { await this.student(user, body.studentId, "plans.publish"); return (0, envelope_1.ok)(await this.plans.publishRange(body.studentId, body.from, body.to, body.published !== false)); }
};
exports.StaffPlansController = StaffPlansController;
__decorate([
    openapi.ApiQuery({ name: "from", required: false }),
    openapi.ApiQuery({ name: "to", required: false }),
    openapi.ApiQuery({ name: "date", required: false }),
    (0, common_1.Get)("plans"),
    (0, capabilities_decorator_1.RequireCapabilities)("plans.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("studentId")),
    __param(2, (0, common_1.Query)("from")),
    __param(3, (0, common_1.Query)("to")),
    __param(4, (0, common_1.Query)("date")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], StaffPlansController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("plans"),
    (0, capabilities_decorator_1.RequireCapabilities)("plans.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, import_plan_dto_1.ImportPlanDto]),
    __metadata("design:returntype", Promise)
], StaffPlansController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)("plans/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("plans.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], StaffPlansController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)("plans/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("plans.delete"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StaffPlansController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)("plans/:id/duplicate"),
    (0, capabilities_decorator_1.RequireCapabilities)("plans.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("planDate")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], StaffPlansController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Post)("plans/:id/tasks"),
    (0, capabilities_decorator_1.RequireCapabilities)("tasks.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], StaffPlansController.prototype, "addTask", null);
__decorate([
    (0, common_1.Patch)("tasks/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("tasks.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], StaffPlansController.prototype, "updateTask", null);
__decorate([
    (0, common_1.Delete)("tasks/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("tasks.delete"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StaffPlansController.prototype, "removeTask", null);
__decorate([
    (0, common_1.Post)("plans/publish-range"),
    (0, capabilities_decorator_1.RequireCapabilities)("plans.publish"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StaffPlansController.prototype, "publish", null);
exports.StaffPlansController = StaffPlansController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [plans_service_1.PlansService, authorization_1.AuthorizationService])
], StaffPlansController);
//# sourceMappingURL=staff-plans.controller.js.map