"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionRequestsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const permission_request_entity_1 = require("../../database/entities/permission-request.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const permission_requests_controller_1 = require("./permission-requests.controller");
const permission_requests_service_1 = require("./permission-requests.service");
let PermissionRequestsModule = class PermissionRequestsModule {
};
exports.PermissionRequestsModule = PermissionRequestsModule;
exports.PermissionRequestsModule = PermissionRequestsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                permission_request_entity_1.PermissionRequest,
                student_entity_1.Student,
                organization_membership_entity_1.OrganizationMembership,
                user_role_assignment_entity_1.UserRoleAssignment,
                audit_log_entity_1.AuditLog,
            ]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [permission_requests_controller_1.PermissionRequestsController],
        providers: [permission_requests_service_1.PermissionRequestsService],
    })
], PermissionRequestsModule);
//# sourceMappingURL=permission-requests.module.js.map