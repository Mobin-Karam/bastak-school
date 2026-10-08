"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const organization_entity_1 = require("../../database/entities/organization.entity");
const registration_progress_entity_1 = require("../../database/entities/registration-progress.entity");
const registration_requirement_entity_1 = require("../../database/entities/registration-requirement.entity");
const student_contact_entity_1 = require("../../database/entities/student-contact.entity");
const student_profile_entity_1 = require("../../database/entities/student-profile.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const school_access_module_1 = require("../school-access/school-access.module");
const registration_controller_1 = require("./registration.controller");
const registration_service_1 = require("./registration.service");
let RegistrationModule = class RegistrationModule {
};
exports.RegistrationModule = RegistrationModule;
exports.RegistrationModule = RegistrationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_entity_1.Student,
                student_profile_entity_1.StudentProfile,
                student_contact_entity_1.StudentContact,
                registration_requirement_entity_1.RegistrationRequirement,
                registration_progress_entity_1.RegistrationProgress,
                organization_entity_1.Organization,
            ]),
            school_access_module_1.SchoolAccessModule,
        ],
        controllers: [registration_controller_1.RegistrationController],
        providers: [registration_service_1.RegistrationService],
        exports: [registration_service_1.RegistrationService],
    })
], RegistrationModule);
//# sourceMappingURL=registration.module.js.map