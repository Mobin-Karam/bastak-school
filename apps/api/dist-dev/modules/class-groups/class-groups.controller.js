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
exports.ClassGroupsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const class_groups_dto_1 = require("./class-groups.dto");
const class_groups_service_1 = require("./class-groups.service");
let ClassGroupsController = class ClassGroupsController {
    groups;
    constructor(groups) {
        this.groups = groups;
    }
    list(user, classId, organizationId) {
        return this.groups.list(user, classId, organizationId).then(envelope_1.ok);
    }
    create(user, dto) {
        return this.groups.create(user, dto).then(envelope_1.ok);
    }
    members(user, id) {
        return this.groups.members(user, id).then(envelope_1.ok);
    }
    setMembers(user, id, dto) {
        return this.groups.setMembers(user, id, dto.studentIds).then(envelope_1.ok);
    }
    remove(user, id) {
        return this.groups.remove(user, id).then(envelope_1.ok);
    }
};
exports.ClassGroupsController = ClassGroupsController;
__decorate([
    openapi.ApiQuery({ name: "classId", required: false }),
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)(),
    (0, capabilities_decorator_1.RequireCapabilities)("class_groups.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("classId")),
    __param(2, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ClassGroupsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, capabilities_decorator_1.RequireCapabilities)("class_groups.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, class_groups_dto_1.CreateClassGroupDto]),
    __metadata("design:returntype", void 0)
], ClassGroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":id/members"),
    (0, capabilities_decorator_1.RequireCapabilities)("class_groups.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClassGroupsController.prototype, "members", null);
__decorate([
    (0, common_1.Put)(":id/members"),
    (0, capabilities_decorator_1.RequireCapabilities)("class_groups.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, class_groups_dto_1.SetClassGroupMembersDto]),
    __metadata("design:returntype", void 0)
], ClassGroupsController.prototype, "setMembers", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("class_groups.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClassGroupsController.prototype, "remove", null);
exports.ClassGroupsController = ClassGroupsController = __decorate([
    (0, common_1.Controller)("class-groups"),
    __metadata("design:paramtypes", [class_groups_service_1.ClassGroupsService])
], ClassGroupsController);
//# sourceMappingURL=class-groups.controller.js.map