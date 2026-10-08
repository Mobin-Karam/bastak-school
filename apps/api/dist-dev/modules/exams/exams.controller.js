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
exports.ExamsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const create_exam_dto_1 = require("./dto/create-exam.dto");
const exams_service_1 = require("./exams.service");
const submit_exam_dto_1 = require("./dto/submit-exam.dto");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const authorization_1 = require("../authorization");
const api_exception_1 = require("../../common/exceptions/api.exception");
let ExamsController = class ExamsController {
    exams;
    authorization;
    constructor(exams, authorization) {
        this.exams = exams;
        this.authorization = authorization;
    }
    context(user) {
        return {
            ...user,
            roles: user.roles ?? [user.role],
            capabilities: user.capabilities ?? [],
            membershipIds: user.membershipIds ?? [],
            organizationIds: user.organizationIds ?? [],
        };
    }
    listCanonical(user) {
        const context = this.context(user);
        return this.exams
            .listScoped(context.organizationIds, context.roles.includes("PLATFORM_ADMIN"))
            .then(envelope_1.ok);
    }
    async createCanonical(user, dto) {
        const context = this.context(user);
        const organizationId = dto.organizationId ??
            (context.organizationIds.length === 1
                ? context.organizationIds[0]
                : undefined);
        if (!context.roles.includes("PLATFORM_ADMIN") &&
            (!organizationId ||
                !this.authorization.canAccessOrganization(context, organizationId, "exams.create")))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        if (dto.studentId &&
            !(await this.authorization.canAccessStudent(context, dto.studentId, "exams.assign")))
            throw new api_exception_1.ApiException(403, "STUDENT_FORBIDDEN", "به این دانش‌آموز دسترسی ندارید.");
        const exam = await this.exams.create({ ...dto, organizationId }, user.id);
        if (dto.studentId)
            await this.exams.assign(exam.id, [dto.studentId], user.id);
        return (0, envelope_1.ok)(exam);
    }
    async updateCanonical(user, id, dto) {
        await this.requireExamScope(user, id, "exams.update");
        return this.exams.update(id, { ...dto }).then(envelope_1.ok);
    }
    async removeCanonical(user, id) {
        await this.requireExamScope(user, id, "exams.delete");
        return this.exams.remove(id).then(envelope_1.ok);
    }
    async questionsCanonical(user, id) {
        await this.requireExamScope(user, id, "questions.read");
        return this.exams.questionsForExam(id).then(envelope_1.ok);
    }
    async analytics(user, id) {
        await this.requireExamScope(user, id, "exams.read");
        return this.exams.analytics(id).then(envelope_1.ok);
    }
    questionBankExams(user) {
        const context = this.context(user);
        return this.exams
            .listScoped(context.organizationIds, context.roles.includes("PLATFORM_ADMIN"))
            .then(envelope_1.ok);
    }
    async addQuestionCanonical(user, id, dto) {
        await this.requireExamScope(user, id, "questions.create");
        return this.exams.addQuestion(id, dto).then(envelope_1.ok);
    }
    async updateQuestionCanonical(user, id, dto) {
        await this.requireExamScope(user, await this.exams.examIdForQuestion(id), "questions.update");
        return this.exams.updateQuestion(id, { ...dto }).then(envelope_1.ok);
    }
    async deleteQuestionCanonical(user, examId, id) {
        await this.requireExamScope(user, examId, "questions.delete");
        return this.exams.deleteQuestion(id, examId).then(envelope_1.ok);
    }
    async assign(user, id, dto) {
        await this.requireExamScope(user, id, "exams.assign");
        for (const studentId of dto.studentIds)
            if (!(await this.authorization.canAccessStudent(this.context(user), studentId, "exams.assign")))
                throw new api_exception_1.ApiException(403, "STUDENT_FORBIDDEN", "به یکی از دانش‌آموزان دسترسی ندارید.");
        return (0, envelope_1.ok)(await this.exams.assign(id, dto.studentIds, user.id));
    }
    async assignments(user, id) {
        await this.requireExamScope(user, id, "exams.read");
        return (0, envelope_1.ok)(await this.exams.assignmentsForExam(id));
    }
    async classAssignments(user, id) {
        await this.requireExamScope(user, id, "exams.read");
        return this.exams.listClassAssignments(id).then(envelope_1.ok);
    }
    async setClassAssignments(user, id, dto) {
        await this.requireExamScope(user, id, "exams.assign");
        return this.exams.setClassAssignments(id, dto.classIds).then(envelope_1.ok);
    }
    async setAudienceRules(user, id, dto) {
        await this.requireExamScope(user, id, "exams.assign");
        return this.exams.setAudienceRules(id, dto).then(envelope_1.ok);
    }
    async unassign(user, id, studentId) {
        await this.requireExamScope(user, id, "exams.assign");
        if (!(await this.authorization.canAccessStudent(this.context(user), studentId, "exams.assign")))
            throw new api_exception_1.ApiException(403, "STUDENT_FORBIDDEN", "به این دانش‌آموز دسترسی ندارید.");
        return (0, envelope_1.ok)(await this.exams.unassign(id, studentId));
    }
    async staffStudentAttempts(user, studentId) {
        await this.requireStudentScope(user, studentId, "exams.read");
        return this.exams.historyForStudent(studentId).then(envelope_1.ok);
    }
    async staffStudentAttempt(user, studentId, attemptId) {
        await this.requireStudentScope(user, studentId, "exams.read");
        return this.exams.attemptForStudent(studentId, attemptId).then(envelope_1.ok);
    }
    async requireExamScope(user, id, capability) {
        const context = this.context(user);
        const organizationId = await this.exams.organizationIdForExam(id);
        if (context.roles.includes("PLATFORM_ADMIN"))
            return;
        if (!organizationId ||
            !this.authorization.canAccessOrganization(context, organizationId, capability))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "آزمون یافت نشد.");
    }
    async requireStudentScope(user, id, capability) {
        if (!(await this.authorization.canAccessStudent(this.context(user), id, capability)))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
    }
    listForStudent(user) {
        return this.exams.listForStudent(user.id).then(envelope_1.ok);
    }
    history(user) {
        return this.exams.history(user.id).then(envelope_1.ok);
    }
    resultForStudent(id, user) {
        return this.exams.resultForStudent(id, user.id).then(envelope_1.ok);
    }
    progress(id, user) {
        return this.exams.progress(id, user.id).then(envelope_1.ok);
    }
    detail(id, user) {
        return this.exams.detail(id, user.id).then(envelope_1.ok);
    }
    saveProgress(id, dto, user) {
        return this.exams.saveProgress(id, dto.answers, user.id).then(envelope_1.ok);
    }
    start(id, user) {
        return this.exams.start(id, user.id).then(envelope_1.ok);
    }
    submit(id, dto, user) {
        return this.exams.submitExam(id, dto.answers, user.id).then(envelope_1.ok);
    }
    heartbeat(examId, attemptId, dto, user) {
        return this.exams
            .heartbeat(examId, attemptId, user.id, dto.currentSectionId)
            .then(envelope_1.ok);
    }
    create(dto) {
        return this.exams.create(dto).then(envelope_1.ok);
    }
    listForAdmin(_studentId) {
        return this.exams.list().then(envelope_1.ok);
    }
    update(id, body) {
        return this.exams.update(id, body).then(envelope_1.ok);
    }
    remove(id) {
        return this.exams.remove(id).then(envelope_1.ok);
    }
    listQuestions(id) {
        return this.exams.questionsForExam(id).then(envelope_1.ok);
    }
    addQuestion(id, dto) {
        return this.exams.addQuestion(id, dto).then(envelope_1.ok);
    }
    updateQuestion(id, body) {
        return this.exams.updateQuestion(id, body).then(envelope_1.ok);
    }
    deleteQuestion(id) {
        return this.exams.deleteQuestion(id).then(envelope_1.ok);
    }
    deleteExamQuestion(examId, id) {
        return this.exams.deleteQuestion(id, examId).then(envelope_1.ok);
    }
    studentAttempts(studentId) {
        return this.exams.historyForStudent(studentId).then(envelope_1.ok);
    }
    studentAttempt(studentId, attemptId) {
        return this.exams.attemptForStudent(studentId, attemptId).then(envelope_1.ok);
    }
    importQuestions(body) {
        return this.exams.importQuestions(body.examId, body.questions).then(envelope_1.ok);
    }
};
exports.ExamsController = ExamsController;
__decorate([
    (0, common_1.Get)("exams"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "listCanonical", null);
__decorate([
    (0, common_1.Post)("exams"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_exam_dto_1.CreateExamDto]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "createCanonical", null);
__decorate([
    (0, common_1.Patch)("exams/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_exam_dto_1.UpdateExamDto]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "updateCanonical", null);
__decorate([
    (0, common_1.Delete)("exams/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.delete"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "removeCanonical", null);
__decorate([
    (0, common_1.Get)("exams/:id/questions"),
    (0, capabilities_decorator_1.RequireCapabilities)("questions.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "questionsCanonical", null);
__decorate([
    (0, common_1.Get)("exams/:id/analytics"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "analytics", null);
__decorate([
    (0, common_1.Get)("question-bank/exams"),
    (0, capabilities_decorator_1.RequireCapabilities)("questions.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "questionBankExams", null);
__decorate([
    (0, common_1.Post)("exams/:id/questions"),
    (0, capabilities_decorator_1.RequireCapabilities)("questions.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_exam_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "addQuestionCanonical", null);
__decorate([
    (0, common_1.Patch)("questions/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("questions.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_exam_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "updateQuestionCanonical", null);
__decorate([
    (0, common_1.Delete)("exams/:examId/questions/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("questions.delete"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("examId")),
    __param(2, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "deleteQuestionCanonical", null);
__decorate([
    (0, common_1.Post)("exams/:id/assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.assign"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_exam_dto_1.AssignExamDto]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "assign", null);
__decorate([
    (0, common_1.Get)("exams/:id/assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "assignments", null);
__decorate([
    (0, common_1.Get)("exams/:id/class-assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "classAssignments", null);
__decorate([
    (0, common_1.Put)("exams/:id/class-assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.assign"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_exam_dto_1.ExamClassAssignmentsDto]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "setClassAssignments", null);
__decorate([
    (0, common_1.Put)("exams/:id/audience-rules"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.assign"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_exam_dto_1.ExamAudienceRulesDto]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "setAudienceRules", null);
__decorate([
    (0, common_1.Delete)("exams/:id/assignments/:studentId"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.assign"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "unassign", null);
__decorate([
    (0, common_1.Get)("students/:studentId/exam-attempts"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "staffStudentAttempts", null);
__decorate([
    (0, common_1.Get)("students/:studentId/exam-attempts/:attemptId"),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("studentId")),
    __param(2, (0, common_1.Param)("attemptId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "staffStudentAttempt", null);
__decorate([
    (0, common_1.Get)("student/exams"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "listForStudent", null);
__decorate([
    (0, common_1.Get)("student/exams/attempts"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "history", null);
__decorate([
    (0, common_1.Get)("student/exams/attempts/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "resultForStudent", null);
__decorate([
    (0, common_1.Get)("student/exams/:id/progress"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "progress", null);
__decorate([
    (0, common_1.Get)("student/exams/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)("student/exams/attempts/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_exam_dto_1.SubmitExamDto, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "saveProgress", null);
__decorate([
    (0, common_1.Post)("student/exams/:id/start"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "start", null);
__decorate([
    (0, common_1.Post)("student/exams/:id/submit"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_exam_dto_1.SubmitExamDto, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)("student/exams/:examId/attempts/:attemptId/heartbeat"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    (0, capabilities_decorator_1.RequireCapabilities)("exams.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("examId")),
    __param(1, (0, common_1.Param)("attemptId")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, submit_exam_dto_1.ExamHeartbeatDto, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)("admin/exams"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_exam_dto_1.CreateExamDto]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "create", null);
__decorate([
    openapi.ApiQuery({ name: "studentId", required: false }),
    (0, common_1.Get)("admin/exams"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "listForAdmin", null);
__decorate([
    (0, common_1.Patch)("admin/exams/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)("admin/exams/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)("admin/exams/:id/questions"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "listQuestions", null);
__decorate([
    (0, common_1.Post)("admin/exams/:id/questions"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "addQuestion", null);
__decorate([
    (0, common_1.Patch)("admin/questions/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.Delete)("admin/questions/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "deleteQuestion", null);
__decorate([
    (0, common_1.Delete)("admin/exams/:examId/questions/:id"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("examId")),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "deleteExamQuestion", null);
__decorate([
    (0, common_1.Get)("admin/students/:studentId/attempts"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("studentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "studentAttempts", null);
__decorate([
    (0, common_1.Get)("admin/students/:studentId/attempts/:attemptId"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("studentId")),
    __param(1, (0, common_1.Param)("attemptId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "studentAttempt", null);
__decorate([
    (0, common_1.Post)("admin/questions/import"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "importQuestions", null);
exports.ExamsController = ExamsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [exams_service_1.ExamsService,
        authorization_1.AuthorizationService])
], ExamsController);
//# sourceMappingURL=exams.controller.js.map