"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const school_schedule_entry_entity_1 = require("../../database/entities/school-schedule-entry.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const schedule_controller_1 = require("./schedule.controller");
const schedule_service_1 = require("./schedule.service");
let ScheduleModule = class ScheduleModule {
};
exports.ScheduleModule = ScheduleModule;
exports.ScheduleModule = ScheduleModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                school_schedule_entry_entity_1.SchoolScheduleEntry,
                organization_entity_1.Organization,
                organization_membership_entity_1.OrganizationMembership,
                education_class_entity_1.EducationClass,
                education_class_enrollment_entity_1.EducationClassEnrollment,
                user_relationship_entity_1.UserRelationship,
            ]),
        ],
        controllers: [schedule_controller_1.ScheduleController],
        providers: [schedule_service_1.ScheduleService],
        exports: [schedule_service_1.ScheduleService],
    })
], ScheduleModule);
//# sourceMappingURL=schedule.module.js.map