"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassGroupsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const study_group_membership_entity_1 = require("../../database/entities/study-group-membership.entity");
const study_group_entity_1 = require("../../database/entities/study-group.entity");
const school_access_module_1 = require("../school-access/school-access.module");
const class_groups_controller_1 = require("./class-groups.controller");
const class_groups_service_1 = require("./class-groups.service");
let ClassGroupsModule = class ClassGroupsModule {
};
exports.ClassGroupsModule = ClassGroupsModule;
exports.ClassGroupsModule = ClassGroupsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                education_class_entity_1.EducationClass,
                education_class_enrollment_entity_1.EducationClassEnrollment,
                study_group_entity_1.StudyGroup,
                study_group_membership_entity_1.StudyGroupMembership,
                student_entity_1.Student,
            ]),
            school_access_module_1.SchoolAccessModule,
        ],
        controllers: [class_groups_controller_1.ClassGroupsController],
        providers: [class_groups_service_1.ClassGroupsService],
        exports: [class_groups_service_1.ClassGroupsService],
    })
], ClassGroupsModule);
//# sourceMappingURL=class-groups.module.js.map