"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationCatalogModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const education_book_entity_1 = require("../../database/entities/education-book.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const plan_entity_1 = require("../../database/entities/plan.entity");
const learning_resource_assignment_entity_1 = require("../../database/entities/learning-resource-assignment.entity");
const exam_attempt_entity_1 = require("../../database/entities/exam-attempt.entity");
const daily_report_entity_1 = require("../../database/entities/daily-report.entity");
const education_catalog_controller_1 = require("./education-catalog.controller");
const education_catalog_service_1 = require("./education-catalog.service");
let EducationCatalogModule = class EducationCatalogModule {
};
exports.EducationCatalogModule = EducationCatalogModule;
exports.EducationCatalogModule = EducationCatalogModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                education_book_entity_1.EducationBook,
                student_entity_1.Student,
                plan_entity_1.Plan,
                learning_resource_assignment_entity_1.LearningResourceAssignment,
                exam_attempt_entity_1.ExamAttempt,
                daily_report_entity_1.DailyReport,
                audit_log_entity_1.AuditLog,
                organization_membership_entity_1.OrganizationMembership,
            ]),
        ],
        controllers: [education_catalog_controller_1.EducationCatalogController],
        providers: [education_catalog_service_1.EducationCatalogService],
        exports: [education_catalog_service_1.EducationCatalogService],
    })
], EducationCatalogModule);
//# sourceMappingURL=education-catalog.module.js.map