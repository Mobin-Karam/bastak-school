"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const exam_entity_1 = require("../../database/entities/exam.entity");
const exam_assignment_entity_1 = require("../../database/entities/exam-assignment.entity");
const exam_class_assignment_entity_1 = require("../../database/entities/exam-class-assignment.entity");
const exam_attempt_entity_1 = require("../../database/entities/exam-attempt.entity");
const exam_retry_request_entity_1 = require("../../database/entities/exam-retry-request.entity");
const exam_syllabus_entity_1 = require("../../database/entities/exam-syllabus.entity");
const quiz_entity_1 = require("../../database/entities/quiz.entity");
const quiz_attempt_entity_1 = require("../../database/entities/quiz-attempt.entity");
const quiz_assignment_entity_1 = require("../../database/entities/quiz-assignment.entity");
const quiz_class_assignment_entity_1 = require("../../database/entities/quiz-class-assignment.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const quiz_question_entity_1 = require("../../database/entities/quiz-question.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const syllabus_progress_entity_1 = require("../../database/entities/syllabus-progress.entity");
const authorization_module_1 = require("../authorization/authorization.module");
const assessments_controller_1 = require("./assessments.controller");
const assessments_service_1 = require("./assessments.service");
let AssessmentsModule = class AssessmentsModule {
};
exports.AssessmentsModule = AssessmentsModule;
exports.AssessmentsModule = AssessmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                exam_entity_1.Exam,
                exam_assignment_entity_1.ExamAssignment,
                exam_class_assignment_entity_1.ExamClassAssignment,
                exam_attempt_entity_1.ExamAttempt,
                exam_syllabus_entity_1.ExamSyllabus,
                syllabus_progress_entity_1.SyllabusProgress,
                exam_retry_request_entity_1.ExamRetryRequest,
                quiz_entity_1.Quiz,
                quiz_question_entity_1.QuizQuestion,
                quiz_attempt_entity_1.QuizAttempt,
                quiz_assignment_entity_1.QuizAssignment,
                quiz_class_assignment_entity_1.QuizClassAssignment,
                education_class_entity_1.EducationClass,
                education_class_enrollment_entity_1.EducationClassEnrollment,
                student_entity_1.Student,
            ]),
            authorization_module_1.AuthorizationModule,
        ],
        controllers: [assessments_controller_1.AssessmentsController],
        providers: [assessments_service_1.AssessmentsService],
    })
], AssessmentsModule);
//# sourceMappingURL=assessments.module.js.map