"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const organization_entity_1 = require("../../database/entities/organization.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const relationships_controller_1 = require("./relationships.controller");
const relationships_service_1 = require("./relationships.service");
let RelationshipsModule = class RelationshipsModule {
};
exports.RelationshipsModule = RelationshipsModule;
exports.RelationshipsModule = RelationshipsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_relationship_entity_1.UserRelationship,
                user_entity_1.User,
                student_entity_1.Student,
                organization_entity_1.Organization,
                organization_membership_entity_1.OrganizationMembership,
                user_role_assignment_entity_1.UserRoleAssignment,
            ]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [relationships_controller_1.RelationshipsController],
        providers: [relationships_service_1.RelationshipsService],
        exports: [relationships_service_1.RelationshipsService],
    })
], RelationshipsModule);
//# sourceMappingURL=relationships.module.js.map