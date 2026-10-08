"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CmbPlatformModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../modules/auth/auth.module");
const authorization_module_1 = require("../modules/authorization/authorization.module");
const health_module_1 = require("../modules/health/health.module");
const notifications_module_1 = require("../modules/notifications/notifications.module");
const organizations_module_1 = require("../modules/organizations/organizations.module");
const realtime_module_1 = require("../modules/realtime/realtime.module");
const system_module_1 = require("../modules/system/system.module");
const users_module_1 = require("../modules/users/users.module");
const cmb_runtime_module_1 = require("./cmb-runtime.module");
const platformModules = [
    cmb_runtime_module_1.CmbRuntimeModule,
    authorization_module_1.AuthorizationModule,
    health_module_1.HealthModule,
    organizations_module_1.OrganizationsModule,
    users_module_1.UsersModule,
    system_module_1.SystemModule,
    auth_module_1.AuthModule,
    realtime_module_1.RealtimeModule,
    notifications_module_1.NotificationsModule,
];
let CmbPlatformModule = class CmbPlatformModule {
};
exports.CmbPlatformModule = CmbPlatformModule;
exports.CmbPlatformModule = CmbPlatformModule = __decorate([
    (0, common_1.Module)({
        imports: platformModules,
        exports: platformModules,
    })
], CmbPlatformModule);
//# sourceMappingURL=cmb-platform.module.js.map