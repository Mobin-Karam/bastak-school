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
exports.OrganizationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const organization_dto_1 = require("./dto/organization.dto");
const organizations_service_1 = require("./organizations.service");
let OrganizationsController = class OrganizationsController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(user) { return this.service.list(user).then(envelope_1.ok); }
    get(user, id) { return this.service.get(user, id).then(envelope_1.ok); }
    create(user, dto) { return this.service.create(user, dto).then(envelope_1.ok); }
    update(user, id, dto) { return this.service.update(user, id, dto).then(envelope_1.ok); }
    setEnabled(user, id, dto) { return this.service.setEnabled(user, id, dto.enabled).then(envelope_1.ok); }
    setFeatures(user, id, dto) { return this.service.setFeatures(user, id, dto.enabledFeatures).then(envelope_1.ok); }
    archive(user, id) { return this.service.archive(user, id).then(envelope_1.ok); }
    members(user, id) { return this.service.listMembers(user, id).then(envelope_1.ok); }
    add(user, id, dto) { return this.service.addMember(user, id, dto).then(envelope_1.ok); }
    updateMember(user, id, userId, dto) { return this.service.updateMember(user, id, userId, dto).then(envelope_1.ok); }
    remove(user, id, userId) { return this.service.removeMember(user, id, userId).then(envelope_1.ok); }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Get)(),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, organization_dto_1.CreateOrganizationDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, organization_dto_1.UpdateOrganizationDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(":id/enabled"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, organization_dto_1.SetOrganizationEnabledDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "setEnabled", null);
__decorate([
    (0, common_1.Patch)(":id/features"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, organization_dto_1.SetOrganizationFeaturesDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "setFeatures", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "archive", null);
__decorate([
    (0, common_1.Get)(":id/members"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.members.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "members", null);
__decorate([
    (0, common_1.Post)(":id/members"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.members.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, organization_dto_1.AddMemberDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "add", null);
__decorate([
    (0, common_1.Patch)(":id/members/:userId"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.members.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("userId")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, organization_dto_1.UpdateMemberDto]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Delete)(":id/members/:userId"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.members.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "remove", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, common_1.Controller)("organizations"),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
//# sourceMappingURL=organizations.controller.js.map