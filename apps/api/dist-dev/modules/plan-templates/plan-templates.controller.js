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
exports.PlanTemplatesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const plan_templates_service_1 = require("./plan-templates.service");
const plan_template_dto_1 = require("./plan-template.dto");
const context = (u) => ({
    ...u,
    roles: u.roles || [u.role],
    capabilities: u.capabilities || [],
    membershipIds: u.membershipIds || [],
    organizationIds: u.organizationIds || [],
});
let PlanTemplatesController = class PlanTemplatesController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(u, id, state) {
        return this.service.list(context(u), id, state).then(envelope_1.ok);
    }
    create(u, body) {
        return this.service.create(context(u), body).then(envelope_1.ok);
    }
    publish(u, id) {
        return this.service.publish(context(u), id).then(envelope_1.ok);
    }
    preview(u, id, body) {
        return this.service.previewApply(context(u), id, body).then(envelope_1.ok);
    }
    apply(u, id, body) {
        return this.service.apply(context(u), id, body).then(envelope_1.ok);
    }
};
exports.PlanTemplatesController = PlanTemplatesController;
__decorate([
    openapi.ApiQuery({ name: "state", required: false }),
    (0, common_1.Get)(),
    (0, capabilities_decorator_1.RequireCapabilities)("plan_templates.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __param(2, (0, common_1.Query)("state")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], PlanTemplatesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, capabilities_decorator_1.RequireCapabilities)("plan_templates.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, plan_template_dto_1.CreatePlanTemplateDto]),
    __metadata("design:returntype", void 0)
], PlanTemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(":id/publish"),
    (0, capabilities_decorator_1.RequireCapabilities)("plan_templates.publish"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PlanTemplatesController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(":id/preview-apply"),
    (0, capabilities_decorator_1.RequireCapabilities)("plan_templates.read", "plans.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, plan_template_dto_1.PreviewPlanTemplateApplyDto]),
    __metadata("design:returntype", void 0)
], PlanTemplatesController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)(":id/apply"),
    (0, capabilities_decorator_1.RequireCapabilities)("plan_templates.read", "plans.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, plan_template_dto_1.ApplyPlanTemplateDto]),
    __metadata("design:returntype", void 0)
], PlanTemplatesController.prototype, "apply", null);
exports.PlanTemplatesController = PlanTemplatesController = __decorate([
    (0, common_1.Controller)("plan-templates"),
    __metadata("design:paramtypes", [plan_templates_service_1.PlanTemplatesService])
], PlanTemplatesController);
//# sourceMappingURL=plan-templates.controller.js.map