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
exports.UsersController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const user_dto_1 = require("./dto/user.dto");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(u, o, r, s) {
        return this.service.list(u, o, r, s).then(envelope_1.ok);
    }
    create(u, d) {
        return this.service.create(u, d).then(envelope_1.ok);
    }
    get(u, id) {
        return this.service.get(u, id).then(envelope_1.ok);
    }
    update(u, id, d) {
        return this.service.update(u, id, d).then(envelope_1.ok);
    }
    activate(u, id) {
        return this.service.setActive(u, id, true).then(envelope_1.ok);
    }
    deactivate(u, id) {
        return this.service.setActive(u, id, false).then(envelope_1.ok);
    }
    archive(u, id) {
        return this.service.archive(u, id).then(envelope_1.ok);
    }
    roles(u, id) {
        return this.service.get(u, id).then((x) => (0, envelope_1.ok)(x.assignments));
    }
    setRoles(u, id, d) {
        return this.service.setRoles(u, id, d).then(envelope_1.ok);
    }
    transferPlatformOwnership(u, d) {
        return this.service.transferPlatformOwnership(u, d.targetUserId).then(envelope_1.ok);
    }
    capabilities(u, id) {
        return this.service.capabilities(u, id).then(envelope_1.ok);
    }
};
exports.UsersController = UsersController;
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    openapi.ApiQuery({ name: "role", required: false }),
    openapi.ApiQuery({ name: "status", required: false }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __param(2, (0, common_1.Query)("role")),
    __param(3, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, capabilities_decorator_1.RequireCapabilities)("users.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("users.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/activate"),
    (0, capabilities_decorator_1.RequireCapabilities)("users.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(":id/deactivate"),
    (0, capabilities_decorator_1.RequireCapabilities)("users.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("users.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "archive", null);
__decorate([
    (0, common_1.Get)(":id/roles"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "roles", null);
__decorate([
    (0, common_1.Put)(":id/roles"),
    (0, capabilities_decorator_1.RequireCapabilities)("users.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, user_dto_1.SetRolesDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setRoles", null);
__decorate([
    (0, common_1.Post)("platform-ownership/transfer"),
    (0, capabilities_decorator_1.RequireCapabilities)("users.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_dto_1.TransferPlatformOwnershipDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "transferPlatformOwnership", null);
__decorate([
    (0, common_1.Get)(":id/capabilities"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "capabilities", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)("users"),
    (0, capabilities_decorator_1.RequireCapabilities)("users.read"),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map