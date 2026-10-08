"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const authorization_service_1 = require("./authorization.service");
const student_entity_1 = require("../../database/entities/student.entity");
const permission_entity_1 = require("../../database/entities/permission.entity");
const user_capability_grant_entity_1 = require("../../database/entities/user-capability-grant.entity");
let AuthorizationModule = class AuthorizationModule {
};
exports.AuthorizationModule = AuthorizationModule;
exports.AuthorizationModule = AuthorizationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_role_assignment_entity_1.UserRoleAssignment,
                organization_membership_entity_1.OrganizationMembership,
                user_relationship_entity_1.UserRelationship,
                student_entity_1.Student,
                permission_entity_1.Permission,
                user_capability_grant_entity_1.UserCapabilityGrant,
            ]),
        ],
        providers: [authorization_service_1.AuthorizationService],
        exports: [authorization_service_1.AuthorizationService],
    })
], AuthorizationModule);
//# sourceMappingURL=authorization.module.js.map