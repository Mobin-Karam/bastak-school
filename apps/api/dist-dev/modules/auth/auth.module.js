"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const session_entity_1 = require("../../database/entities/session.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const me_controller_1 = require("./me.controller");
const login_throttle_entity_1 = require("../../database/entities/login-throttle.entity");
const login_throttle_service_1 = require("./login-throttle.service");
const organization_entity_1 = require("../../database/entities/organization.entity");
const account_change_request_entity_1 = require("../../database/entities/account-change-request.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                session_entity_1.Session,
                student_entity_1.Student,
                user_role_assignment_entity_1.UserRoleAssignment,
                organization_membership_entity_1.OrganizationMembership,
                login_throttle_entity_1.LoginThrottle,
                organization_entity_1.Organization,
                account_change_request_entity_1.AccountChangeRequest,
            ]),
        ],
        controllers: [auth_controller_1.AuthController, me_controller_1.MeController],
        providers: [auth_service_1.AuthService, login_throttle_service_1.LoginThrottleService],
        exports: [auth_service_1.AuthService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map