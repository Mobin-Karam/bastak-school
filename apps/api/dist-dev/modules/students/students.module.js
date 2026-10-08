"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const topic_mastery_entity_1 = require("../../database/entities/topic-mastery.entity");
const learning_item_entity_1 = require("../../database/entities/learning-item.entity");
const learning_review_entity_1 = require("../../database/entities/learning-review.entity");
const session_entity_1 = require("../../database/entities/session.entity");
const attendance_record_entity_1 = require("../../database/entities/attendance-record.entity");
const attendance_session_entity_1 = require("../../database/entities/attendance-session.entity");
const students_controller_1 = require("./students.controller");
const students_service_1 = require("./students.service");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const student_administration_service_1 = require("./student-administration.service");
const student_administration_controller_1 = require("./student-administration.controller");
const task_issue_entity_1 = require("../../database/entities/task-issue.entity");
const recovery_request_entity_1 = require("../../database/entities/recovery-request.entity");
const exam_retry_request_entity_1 = require("../../database/entities/exam-retry-request.entity");
const education_catalog_1 = require("../education-catalog");
let StudentsModule = class StudentsModule {
};
exports.StudentsModule = StudentsModule;
exports.StudentsModule = StudentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            education_catalog_1.EducationCatalogModule,
            typeorm_1.TypeOrmModule.forFeature([
                student_entity_1.Student,
                user_entity_1.User,
                topic_mastery_entity_1.TopicMastery,
                learning_item_entity_1.LearningItem,
                learning_review_entity_1.LearningReview,
                session_entity_1.Session,
                attendance_session_entity_1.AttendanceSession,
                attendance_record_entity_1.AttendanceRecord,
                organization_membership_entity_1.OrganizationMembership,
                user_relationship_entity_1.UserRelationship,
                task_issue_entity_1.TaskIssue,
                recovery_request_entity_1.RecoveryRequest,
                exam_retry_request_entity_1.ExamRetryRequest,
            ]),
        ],
        controllers: [
            students_controller_1.StudentController,
            students_controller_1.StudentParityController,
            students_controller_1.StudentsController,
            student_administration_controller_1.StudentAdministrationController,
        ],
        providers: [students_service_1.StudentsService, student_administration_service_1.StudentAdministrationService],
        exports: [students_service_1.StudentsService],
    })
], StudentsModule);
//# sourceMappingURL=students.module.js.map