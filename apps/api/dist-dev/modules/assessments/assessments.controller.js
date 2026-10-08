"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const assessments_service_1 = require("./assessments.service");
const assessment_dto_1 = require("./dto/assessment.dto");
let AssessmentsController = class AssessmentsController {
    service;
    constructor(service) {
        this.service = service;
    }
    context(u) { return { ...u, roles: u.roles ?? [u.role], capabilities: u.capabilities ?? [], membershipIds: u.membershipIds ?? [], organizationIds: u.organizationIds ?? [] }; }
    addSyllabus(u, id, dto) { return this.service.addSyllabus(this.context(u), id, dto).then(envelope_1.ok); }
    removeSyllabus(u, id) { return this.service.removeSyllabus(this.context(u), id).then(envelope_1.ok); }
    progress(u, id, dto) { return this.service.updateProgress(u.id, id, dto).then(envelope_1.ok); }
    studentSyllabus(u, id) { return this.service.studentSyllabus(u.id, id).then(envelope_1.ok); }
    retry(u, id, dto) { return this.service.requestRetry(u.id, id, dto.message).then(envelope_1.ok); }
    studentRetries(u) { return this.service.studentRetries(u.id).then(envelope_1.ok); }
    retries(u) { return this.service.listRetries(this.context(u)).then(envelope_1.ok); }
    moderate(u, id, dto) { return this.service.moderateRetry(this.context(u), u.id, id, dto).then(envelope_1.ok); }
    studentQuizzes(u) { return this.service.studentQuizzes(u.id).then(envelope_1.ok); }
    quizzes(u) { return this.service.listQuizzes(this.context(u)).then(envelope_1.ok); }
    createQuiz(u, dto) { return this.service.createQuiz(this.context(u), dto).then(envelope_1.ok); }
    updateQuiz(u, id, dto) { return this.service.updateQuiz(this.context(u), id, dto).then(envelope_1.ok); }
    quizAssignments(u, id) { return this.service.listQuizAssignments(this.context(u), id).then(envelope_1.ok); }
    assignQuiz(u, id, dto) { return this.service.assignQuiz(this.context(u), id, dto.studentIds).then(envelope_1.ok); }
    quizClassAssignments(u, id) { return this.service.listQuizClassAssignments(this.context(u), id).then(envelope_1.ok); }
    assignQuizClasses(u, id, dto) { return this.service.assignQuizClasses(this.context(u), id, dto.classIds).then(envelope_1.ok); }
    setQuizAudienceRules(u, id, dto) { return this.service.setQuizAudienceRules(this.context(u), id, dto).then(envelope_1.ok); }
    releaseQuizResults(u, id) { return this.service.releaseQuizResults(this.context(u), id).then(envelope_1.ok); }
    removeQuiz(u, id) { return this.service.removeQuiz(this.context(u), id).then(envelope_1.ok); }
    history(u) { return this.service.history(u.id).then(envelope_1.ok); }
    historyDetail(u, id) { return this.service.history(u.id, id).then(envelope_1.ok); }
    questions(u, id) { return this.service.quizQuestions(this.context(u), id).then(envelope_1.ok); }
    analytics(u, id) { return this.service.quizAnalytics(this.context(u), id).then(envelope_1.ok); }
    addQuestion(u, id, dto) { return this.service.addQuizQuestion(this.context(u), id, dto).then(envelope_1.ok); }
    updateQuestion(u, id, dto) { return this.service.updateQuizQuestion(this.context(u), id, dto).then(envelope_1.ok); }
    removeQuestion(u, id) { return this.service.removeQuizQuestion(this.context(u), id).then(envelope_1.ok); }
    quiz(u, id) { return this.service.studentQuiz(u.id, id).then(envelope_1.ok); }
    start(u, id) { return this.service.startQuiz(u.id, id).then(envelope_1.ok); }
    submit(u, id, dto) { return this.service.submitQuiz(u.id, id, dto).then(envelope_1.ok); }
};
exports.AssessmentsController = AssessmentsController;
__decorate([
    (0, common_1.Post)("exams/:id/syllabus"),
    (0, capabilities_decorator_1.RequireCapabilities)("syllabus.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.SyllabusDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "addSyllabus", null);
__decorate([
    (0, common_1.Delete)("syllabus/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("syllabus.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "removeSyllabus", null);
__decorate([
    (0, common_1.Put)("syllabus/:id/progress"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.SyllabusProgressDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "progress", null);
__decorate([
    (0, common_1.Get)("student/exams/:id/syllabus"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "studentSyllabus", null);
__decorate([
    (0, common_1.Post)("exams/:id/retry-request"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.RetryRequestDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "retry", null);
__decorate([
    (0, common_1.Get)("student/exam-attempt-requests"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "studentRetries", null);
__decorate([
    (0, common_1.Get)("exam-attempt-requests"),
    (0, capabilities_decorator_1.RequireCapabilities)("retry_requests.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "retries", null);
__decorate([
    (0, common_1.Patch)("exam-attempt-requests/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("retry_requests.moderate"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.ModerateRetryDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "moderate", null);
__decorate([
    (0, common_1.Get)("student/quizzes"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("student.quizzes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "studentQuizzes", null);
__decorate([
    (0, common_1.Get)("quizzes"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "quizzes", null);
__decorate([
    (0, common_1.Post)("quizzes"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, assessment_dto_1.CreateQuizDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "createQuiz", null);
__decorate([
    (0, common_1.Patch)("quizzes/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.UpdateQuizDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "updateQuiz", null);
__decorate([
    (0, common_1.Get)("quizzes/:id/assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "quizAssignments", null);
__decorate([
    (0, common_1.Put)("quizzes/:id/assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.QuizAssignmentsDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "assignQuiz", null);
__decorate([
    (0, common_1.Get)("quizzes/:id/class-assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "quizClassAssignments", null);
__decorate([
    (0, common_1.Put)("quizzes/:id/class-assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.QuizClassAssignmentsDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "assignQuizClasses", null);
__decorate([
    (0, common_1.Put)("quizzes/:id/audience-rules"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.QuizAudienceRulesDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "setQuizAudienceRules", null);
__decorate([
    (0, common_1.Post)("quizzes/:id/release-results"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.update"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "releaseQuizResults", null);
__decorate([
    (0, common_1.Delete)("quizzes/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "removeQuiz", null);
__decorate([
    (0, common_1.Get)("quizzes/history"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("student.quizzes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "history", null);
__decorate([
    (0, common_1.Get)("quizzes/history/:attemptId"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("student.quizzes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("attemptId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "historyDetail", null);
__decorate([
    (0, common_1.Get)("quizzes/:id/questions"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "questions", null);
__decorate([
    (0, common_1.Get)("quizzes/:id/analytics"),
    (0, capabilities_decorator_1.RequireCapabilities)("quizzes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "analytics", null);
__decorate([
    (0, common_1.Post)("quizzes/:id/questions"),
    (0, capabilities_decorator_1.RequireCapabilities)("quiz_questions.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.QuizQuestionDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "addQuestion", null);
__decorate([
    (0, common_1.Patch)("quiz-questions/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("quiz_questions.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.QuizQuestionDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.Delete)("quiz-questions/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("quiz_questions.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "removeQuestion", null);
__decorate([
    (0, common_1.Get)("quizzes/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("student.quizzes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "quiz", null);
__decorate([
    (0, common_1.Post)("quizzes/:id/start"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("student.quizzes.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "start", null);
__decorate([
    (0, common_1.Post)("quizzes/:id/attempts"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("student.quizzes.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, assessment_dto_1.SubmitQuizDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "submit", null);
exports.AssessmentsController = AssessmentsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [assessments_service_1.AssessmentsService])
], AssessmentsController);
//# sourceMappingURL=assessments.controller.js.map