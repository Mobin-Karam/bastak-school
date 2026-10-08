"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const education_book_entity_1 = require("../../database/entities/education-book.entity");
const education_class_book_entity_1 = require("../../database/entities/education-class-book.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const classes_controller_1 = require("./classes.controller");
const classes_service_1 = require("./classes.service");
const education_catalog_module_1 = require("../education-catalog/education-catalog.module");
let ClassesModule = class ClassesModule {
};
exports.ClassesModule = ClassesModule;
exports.ClassesModule = ClassesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                education_class_entity_1.EducationClass,
                education_class_book_entity_1.EducationClassBook,
                education_class_enrollment_entity_1.EducationClassEnrollment,
                education_book_entity_1.EducationBook,
                organization_entity_1.Organization,
                organization_membership_entity_1.OrganizationMembership,
                student_entity_1.Student,
                user_entity_1.User,
                user_role_assignment_entity_1.UserRoleAssignment,
            ]),
            education_catalog_module_1.EducationCatalogModule,
        ],
        controllers: [classes_controller_1.ClassesController],
        providers: [classes_service_1.ClassesService],
    })
], ClassesModule);
//# sourceMappingURL=classes.module.js.map