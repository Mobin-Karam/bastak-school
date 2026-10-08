"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationSharingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const learning_resource_entity_1 = require("../../database/entities/learning-resource.entity");
const learning_resource_assignment_entity_1 = require("../../database/entities/learning-resource-assignment.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const plan_entity_1 = require("../../database/entities/plan.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const task_entity_1 = require("../../database/entities/task.entity");
const authorization_module_1 = require("../authorization/authorization.module");
const realtime_module_1 = require("../realtime/realtime.module");
const education_sharing_controller_1 = require("./education-sharing.controller");
const education_sharing_service_1 = require("./education-sharing.service");
let EducationSharingModule = class EducationSharingModule {
};
exports.EducationSharingModule = EducationSharingModule;
exports.EducationSharingModule = EducationSharingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_entity_1.Student,
                organization_membership_entity_1.OrganizationMembership,
                plan_entity_1.Plan,
                task_entity_1.Task,
                learning_resource_entity_1.LearningResource,
                learning_resource_assignment_entity_1.LearningResourceAssignment,
                audit_log_entity_1.AuditLog,
            ]),
            authorization_module_1.AuthorizationModule,
            realtime_module_1.RealtimeModule,
        ],
        controllers: [education_sharing_controller_1.EducationSharingController],
        providers: [education_sharing_service_1.EducationSharingService],
    })
], EducationSharingModule);
//# sourceMappingURL=education-sharing.module.js.map