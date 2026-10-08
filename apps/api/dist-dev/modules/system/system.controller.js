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
exports.SystemController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const api_exception_1 = require("../../common/exceptions/api.exception");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const system_service_1 = require("./system.service");
let SystemController = class SystemController {
    system;
    constructor(system) {
        this.system = system;
    }
    version(app) {
        return this.system.publicVersion(app).then(envelope_1.ok);
    }
    versions() {
        return this.system.listVersions().then(envelope_1.ok);
    }
    setVersion(app, body) {
        return this.system.updateVersion(app, body).then(envelope_1.ok);
    }
    releases() {
        return this.system.listReleases().then(envelope_1.ok);
    }
    setRelease(app, body) {
        return this.system.updateRelease(app, body).then(envelope_1.ok);
    }
    audit() {
        return this.system.auditLogs().then(envelope_1.ok);
    }
    database() {
        return this.system.metadata().then(envelope_1.ok);
    }
    async backup(user) {
        const file = await this.system.backup(user.id);
        return new common_1.StreamableFile(file.buffer, {
            type: "application/vnd.sqlite3",
            disposition: `attachment; filename="${file.filename}"`,
        });
    }
    restore(user, body) {
        return this.system.restore(user.id, body).then(envelope_1.ok);
    }
    resetData(user, body) {
        if (body?.confirmation !== "RESET_SYSTEM_DATA")
            throw new api_exception_1.ApiException(422, "RESET_CONFIRMATION_REQUIRED", "عبارت تأیید بازنشانی معتبر نیست.");
        return this.system.resetSystemData(user).then(envelope_1.ok);
    }
};
exports.SystemController = SystemController;
__decorate([
    (0, common_1.Get)("public/app-version/:app"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("app")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "version", null);
__decorate([
    (0, common_1.Get)("app-versions"),
    (0, capabilities_decorator_1.RequireCapabilities)("release.read"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "versions", null);
__decorate([
    (0, common_1.Put)("app-versions/:app"),
    (0, capabilities_decorator_1.RequireCapabilities)("release.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("app")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "setVersion", null);
__decorate([
    (0, common_1.Get)("app-releases"),
    (0, capabilities_decorator_1.RequireCapabilities)("release.read"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "releases", null);
__decorate([
    (0, common_1.Put)("app-releases/:app"),
    (0, capabilities_decorator_1.RequireCapabilities)("release.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("app")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "setRelease", null);
__decorate([
    (0, common_1.Get)("audit"),
    (0, capabilities_decorator_1.RequireCapabilities)("audit.read"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "audit", null);
__decorate([
    (0, common_1.Get)("system/database"),
    (0, capabilities_decorator_1.RequireCapabilities)("database.read"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "database", null);
__decorate([
    (0, common_1.Post)("system/database-backup"),
    (0, capabilities_decorator_1.RequireCapabilities)("database.backup"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SystemController.prototype, "backup", null);
__decorate([
    (0, common_1.Post)("system/database-restore"),
    (0, capabilities_decorator_1.RequireCapabilities)("database.restore"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Buffer]),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)("system/reset-data"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.PLATFORM_ADMIN),
    (0, capabilities_decorator_1.RequireCapabilities)("system.reset"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SystemController.prototype, "resetData", null);
exports.SystemController = SystemController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [system_service_1.SystemService])
], SystemController);
//# sourceMappingURL=system.controller.js.map