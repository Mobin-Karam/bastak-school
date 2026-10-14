"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleModule = void 0;
const school_access_1 = require("../school-access");
const attendance_1 = require("../attendance");
const notifications_1 = require("../notifications");
const timetable_service_1 = require("./timetable.service");
const timetable_controller_1 = require("./timetable.controller");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const school_schedule_entry_entity_1 = require("../../database/entities/school-schedule-entry.entity");
const education_class_book_entity_1 = require("../../database/entities/education-class-book.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const schedule_controller_1 = require("./schedule.controller");
const schedule_service_1 = require("./schedule.service");
let ScheduleModule = class ScheduleModule {
};
exports.ScheduleModule = ScheduleModule;
exports.ScheduleModule = ScheduleModule = __decorate([
    (0, common_1.Module)({
        imports: [school_access_1.SchoolAccessModule, attendance_1.AttendanceModule, notifications_1.NotificationsModule,
            typeorm_1.TypeOrmModule.forFeature([
                school_schedule_entry_entity_1.SchoolScheduleEntry,
                education_class_book_entity_1.EducationClassBook,
                organization_entity_1.Organization,
                organization_membership_entity_1.OrganizationMembership,
                education_class_entity_1.EducationClass,
                education_class_enrollment_entity_1.EducationClassEnrollment,
                user_relationship_entity_1.UserRelationship,
            ]),
        ],
        controllers: [schedule_controller_1.ScheduleController, timetable_controller_1.TimetableController],
        providers: [schedule_service_1.ScheduleService, timetable_service_1.TimetableService],
        exports: [schedule_service_1.ScheduleService],
    })
], ScheduleModule);
//# sourceMappingURL=schedule.module.js.map