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
exports.QuestionBankController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const question_bank_service_1 = require("./question-bank.service");
const question_bank_dto_1 = require("./question-bank.dto");
let QuestionBankController = class QuestionBankController {
    service;
    constructor(service) {
        this.service = service;
    }
    c(u) {
        return {
            ...u,
            roles: u.roles ?? [u.role],
            capabilities: u.capabilities ?? [],
            membershipIds: u.membershipIds ?? [],
            organizationIds: u.organizationIds ?? [],
        };
    }
    list(u, org, bankType) {
        return this.service.list(this.c(u), org, bankType).then(envelope_1.ok);
    }
    template(u, bankType) {
        return this.service.template(this.c(u), bankType).then(envelope_1.ok);
    }
    export(u, org, bankType) {
        return this.service.export(this.c(u), org, bankType).then(envelope_1.ok);
    }
    import(u, body) {
        return this.service.import(this.c(u), body).then(envelope_1.ok);
    }
    create(u, b) {
        return this.service.save(this.c(u), b).then(envelope_1.ok);
    }
    update(u, id, b) {
        return this.service.save(this.c(u), b, id).then(envelope_1.ok);
    }
    archive(u, id) {
        return this.service.archive(this.c(u), id).then(envelope_1.ok);
    }
    addToExam(u, id, body) {
        if (!body.examId)
            throw new Error("examId is required");
        return this.service.copyToExam(this.c(u), id, body.examId).then(envelope_1.ok);
    }
    copyExamItemsToQuizBank(u, body) {
        if (!Array.isArray(body.itemIds) || !body.itemIds.length)
            throw new Error("itemIds is required");
        return this.service
            .copyExamItemsToQuizBank(this.c(u), body.itemIds)
            .then(envelope_1.ok);
    }
    generateExam(u, body) {
        return this.service.generateExam(this.c(u), body).then(envelope_1.ok);
    }
    addToQuiz(u, id, body) {
        if (!body.quizId)
            throw new Error("quizId is required");
        return this.service.copyToQuiz(this.c(u), id, body.quizId).then(envelope_1.ok);
    }
};
exports.QuestionBankController = QuestionBankController;
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    openapi.ApiQuery({ name: "bankType", required: false }),
    (0, common_1.Get)(),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __param(2, (0, common_1.Query)("bankType")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "list", null);
__decorate([
    openapi.ApiQuery({ name: "bankType", required: false }),
    (0, common_1.Get)("template"),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("bankType")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "template", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    openapi.ApiQuery({ name: "bankType", required: false }),
    (0, common_1.Get)("export"),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __param(2, (0, common_1.Query)("bankType")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "export", null);
__decorate([
    (0, common_1.Post)("import"),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "import", null);
__decorate([
    (0, common_1.Post)(),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "archive", null);
__decorate([
    (0, common_1.Post)(":id/add-to-exam"),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage", "questions.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "addToExam", null);
__decorate([
    (0, common_1.Post)("copy-exam-items-to-quiz-bank"),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "copyExamItemsToQuizBank", null);
__decorate([
    (0, common_1.Post)("generate/exam"),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage", "questions.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, question_bank_dto_1.GenerateExamFromBankDto]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "generateExam", null);
__decorate([
    (0, common_1.Post)(":id/add-to-quiz"),
    (0, capabilities_decorator_1.RequireCapabilities)("question_bank.manage", "quiz_questions.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], QuestionBankController.prototype, "addToQuiz", null);
exports.QuestionBankController = QuestionBankController = __decorate([
    (0, common_1.Controller)("question-bank"),
    __metadata("design:paramtypes", [question_bank_service_1.QuestionBankService])
], QuestionBankController);
//# sourceMappingURL=question-bank.controller.js.map