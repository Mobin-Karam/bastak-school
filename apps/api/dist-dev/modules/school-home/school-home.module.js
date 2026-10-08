"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolHomeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const school_announcement_entity_1 = require("../../database/entities/school-announcement.entity");
const school_prayer_time_entity_1 = require("../../database/entities/school-prayer-time.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const school_home_controller_1 = require("./school-home.controller");
const school_home_service_1 = require("./school-home.service");
let SchoolHomeModule = class SchoolHomeModule {
};
exports.SchoolHomeModule = SchoolHomeModule;
exports.SchoolHomeModule = SchoolHomeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                organization_entity_1.Organization,
                school_prayer_time_entity_1.SchoolPrayerTime,
                school_announcement_entity_1.SchoolAnnouncement,
                education_class_entity_1.EducationClass,
                education_class_enrollment_entity_1.EducationClassEnrollment,
                user_relationship_entity_1.UserRelationship,
            ]),
        ],
        controllers: [school_home_controller_1.SchoolHomeController],
        providers: [school_home_service_1.SchoolHomeService],
        exports: [school_home_service_1.SchoolHomeService],
    })
], SchoolHomeModule);
//# sourceMappingURL=school-home.module.js.map