"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const exam_attempt_entity_1 = require("../../database/entities/exam-attempt.entity");
const exam_entity_1 = require("../../database/entities/exam.entity");
const question_entity_1 = require("../../database/entities/question.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const exams_controller_1 = require("./exams.controller");
const exams_service_1 = require("./exams.service");
const exam_scoring_service_1 = require("./exam-scoring.service");
const exam_assignment_entity_1 = require("../../database/entities/exam-assignment.entity");
const exam_retry_request_entity_1 = require("../../database/entities/exam-retry-request.entity");
const mistake_entity_1 = require("../../database/entities/mistake.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const exam_class_assignment_entity_1 = require("../../database/entities/exam-class-assignment.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
let ExamsModule = class ExamsModule {
};
exports.ExamsModule = ExamsModule;
exports.ExamsModule = ExamsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                exam_entity_1.Exam,
                question_entity_1.Question,
                exam_attempt_entity_1.ExamAttempt,
                exam_assignment_entity_1.ExamAssignment,
                exam_class_assignment_entity_1.ExamClassAssignment,
                education_class_entity_1.EducationClass,
                education_class_enrollment_entity_1.EducationClassEnrollment,
                exam_retry_request_entity_1.ExamRetryRequest,
                student_entity_1.Student,
                user_entity_1.User,
                organization_entity_1.Organization,
                mistake_entity_1.Mistake,
            ]),
        ],
        controllers: [exams_controller_1.ExamsController],
        providers: [exams_service_1.ExamsService, exam_scoring_service_1.ExamScoringService],
        exports: [exams_service_1.ExamsService],
    })
], ExamsModule);
//# sourceMappingURL=exams.module.js.map