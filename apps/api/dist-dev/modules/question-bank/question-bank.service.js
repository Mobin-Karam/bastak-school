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
exports.QuestionBankService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const question_bank_item_entity_1 = require("../../database/entities/question-bank-item.entity");
const exam_entity_1 = require("../../database/entities/exam.entity");
const question_entity_1 = require("../../database/entities/question.entity");
const quiz_entity_1 = require("../../database/entities/quiz.entity");
const quiz_question_entity_1 = require("../../database/entities/quiz-question.entity");
const authorization_1 = require("../authorization");
let QuestionBankService = class QuestionBankService {
    items;
    exams;
    questions;
    quizzes;
    quizQuestions;
    authz;
    constructor(items, exams, questions, quizzes, quizQuestions, authz) {
        this.items = items;
        this.exams = exams;
        this.questions = questions;
        this.quizzes = quizzes;
        this.quizQuestions = quizQuestions;
        this.authz = authz;
    }
    async list(c, organizationId, bankType = "exam") {
        if (bankType !== "exam" && bankType !== "quiz")
            throw new api_exception_1.ApiException(400, "INVALID_QUESTION_BANK", "Unknown question-bank type.");
        return (await this.items.find({
            where: { archivedAt: (0, typeorm_2.IsNull)(), bankType },
            relations: { organization: true },
            order: { updatedAt: "DESC" },
        })).filter((x) => this.allowed(c, organizationId ?? x.organization?.id));
    }
    async template(c, bankType = "exam") {
        this.assertBankType(bankType);
        const organizationId = c.organizationIds[0] || "";
        return {
            schemaVersion: "1.0",
            bankType,
            questions: [this.sampleQuestion(organizationId)],
        };
    }
    async export(c, organizationId, bankType = "exam") {
        this.assertBankType(bankType);
        const questions = await this.list(c, organizationId, bankType);
        return {
            schemaVersion: "1.0",
            bankType,
            questions: questions.map((item) => this.transferQuestion(item)),
        };
    }
    async import(c, body) {
        const bankType = body.bankType || "exam";
        this.assertBankType(bankType);
        if (!Array.isArray(body.questions) || !body.questions.length)
            throw new api_exception_1.ApiException(400, "QUESTION_BANK_IMPORT_EMPTY", "At least one question is required.");
        if (body.questions.length > 500)
            throw new api_exception_1.ApiException(400, "QUESTION_BANK_IMPORT_TOO_LARGE", "A maximum of 500 questions can be imported at once.");
        const normalized = body.questions.map((question, index) => {
            try {
                return this.normalizeDraft(c, { ...question, bankType }, bankType);
            }
            catch (error) {
                const response = error instanceof api_exception_1.ApiException ? error.getResponse() : null;
                const message = response &&
                    typeof response === "object" &&
                    "error" in response &&
                    response.error &&
                    typeof response.error === "object" &&
                    "message" in response.error
                    ? String(response.error.message)
                    : error instanceof Error
                        ? error.message
                        : "Invalid question.";
                throw new api_exception_1.ApiException(400, "QUESTION_BANK_IMPORT_INVALID", `Row ${index + 1}: ${message}`);
            }
        });
        const created = await this.items.manager.transaction(async (manager) => manager.save(question_bank_item_entity_1.QuestionBankItem, normalized.map((item) => manager.create(question_bank_item_entity_1.QuestionBankItem, item))));
        return { created: created.length };
    }
    async save(c, body, id) {
        let item = id
            ? await this.items.findOne({
                where: { id },
                relations: { organization: true },
            })
            : this.items.create();
        if (!item || (id && !this.allowed(c, item.organization?.id)))
            throw new api_exception_1.ApiException(404, "QUESTION_BANK_ITEM_NOT_FOUND", "Question-bank item not found.");
        const requestedBankType = body.bankType === "quiz" ? "quiz" : "exam";
        if (id && item.bankType !== requestedBankType)
            throw new api_exception_1.ApiException(400, "QUESTION_BANK_TYPE_IMMUTABLE", "Question-bank type cannot be changed.");
        Object.assign(item, this.normalizeDraft(c, body, id ? item.bankType : requestedBankType, item.organization?.id));
        return this.items.save(item);
    }
    async archive(c, id) {
        const item = await this.items.findOne({
            where: { id },
            relations: { organization: true },
        });
        if (!item || !this.allowed(c, item.organization?.id))
            throw new api_exception_1.ApiException(404, "QUESTION_BANK_ITEM_NOT_FOUND", "Question-bank item not found.");
        item.archivedAt = new Date();
        await this.items.save(item);
        return { id, archived: true };
    }
    async copyToExam(c, id, examId) {
        const [item, exam] = await Promise.all([
            this.items.findOne({ where: { id }, relations: { organization: true } }),
            this.exams.findOne({
                where: { id: examId },
                relations: { organization: true },
            }),
        ]);
        if (!item ||
            !exam ||
            !this.allowed(c, item.organization?.id) ||
            !this.allowed(c, exam.organization?.id) ||
            item.bankType !== "exam")
            throw new api_exception_1.ApiException(404, "QUESTION_BANK_ITEM_NOT_FOUND", "Question-bank item or exam not found.");
        const sortOrder = (await this.questions.count({ where: { exam: { id: exam.id } } })) + 1;
        return this.questions.save(this.questions.create({
            text: item.text,
            options: item.options,
            correctAnswer: item.correctAnswer,
            explanation: item.explanation,
            subject: item.subject,
            topic: item.topic,
            book: item.book,
            grade: item.grade,
            chapter: item.chapter,
            lesson: item.lesson,
            difficulty: item.difficulty,
            source: item.source,
            tags: item.tags,
            sectionId: "",
            sortOrder,
            exam,
            questionBankItemId: item.id,
        }));
    }
    async generateExam(c, dto) {
        const exam = await this.exams.findOne({
            where: { id: dto.examId },
            relations: { organization: true },
        });
        if (!exam || !this.allowed(c, exam.organization?.id))
            throw new api_exception_1.ApiException(404, "EXAM_NOT_FOUND", "Exam not found.");
        const pool = (await this.items.find({
            where: { archivedAt: (0, typeorm_2.IsNull)(), bankType: "exam" },
            relations: { organization: true },
            order: { updatedAt: "DESC" },
        })).filter((item) => this.allowed(c, item.organization?.id) &&
            item.organization?.id === exam.organization?.id &&
            (!dto.subject || item.subject === dto.subject) &&
            (!dto.topic || item.topic === dto.topic) &&
            (!dto.grade || item.grade === dto.grade) &&
            (!dto.chapter || item.chapter === dto.chapter));
        const requested = dto.itemIds?.length
            ? pool.filter((item) => dto.itemIds.includes(item.id))
            : this.pickBalanced(pool, dto);
        if (!requested.length)
            throw new api_exception_1.ApiException(422, "QUESTION_BANK_EMPTY", "No matching question-bank items found.");
        if (!dto.commit)
            return {
                preview: true,
                requested: this.requestedCounts(dto),
                selected: requested.map((item) => ({
                    id: item.id,
                    text: item.text,
                    difficulty: item.difficulty,
                    subject: item.subject,
                    topic: item.topic,
                })),
            };
        const existing = await this.questions.find({
            where: { exam: { id: exam.id } },
        });
        const sourceIds = new Set(existing.map((question) => question.questionBankItemId).filter(Boolean));
        const items = requested.filter((item) => !sourceIds.has(item.id));
        const start = existing.length + 1;
        const created = await this.questions.save(items.map((item, index) => this.questions.create({
            text: item.text,
            options: item.options,
            correctAnswer: item.correctAnswer,
            explanation: item.explanation,
            subject: item.subject,
            topic: item.topic,
            book: item.book,
            grade: item.grade,
            chapter: item.chapter,
            lesson: item.lesson,
            difficulty: item.difficulty,
            source: item.source,
            tags: item.tags,
            sectionId: "",
            sortOrder: start + index,
            exam,
            questionBankItemId: item.id,
        })));
        return {
            preview: false,
            created: created.length,
            skipped: requested.length - created.length,
            questions: created,
        };
    }
    async copyToQuiz(c, id, quizId) {
        const [item, quiz] = await Promise.all([
            this.items.findOne({ where: { id }, relations: { organization: true } }),
            this.quizzes.findOne({
                where: { id: quizId },
                relations: { organization: true, exam: { organization: true } },
            }),
        ]);
        const organizationId = quiz?.organization?.id ?? quiz?.exam?.organization?.id;
        if (!item ||
            !quiz ||
            !this.allowed(c, item.organization?.id) ||
            !this.allowed(c, organizationId) ||
            item.bankType !== "quiz")
            throw new api_exception_1.ApiException(404, "QUESTION_BANK_ITEM_NOT_FOUND", "Question-bank item or quiz not found.");
        const sortOrder = (await this.quizQuestions.count({ where: { quiz: { id: quiz.id } } })) +
            1;
        return this.quizQuestions.save(this.quizQuestions.create({
            text: item.text,
            options: item.options,
            correctAnswer: item.correctAnswer,
            explanation: item.explanation,
            sortOrder,
            quiz,
            questionBankItemId: item.id,
        }));
    }
    async copyExamItemsToQuizBank(c, itemIds) {
        const ids = [...new Set(itemIds)];
        const sources = await this.items.find({
            where: { id: (0, typeorm_2.In)(ids), archivedAt: (0, typeorm_2.IsNull)(), bankType: "exam" },
            relations: { organization: true },
        });
        if (sources.length !== ids.length ||
            sources.some((item) => !this.allowed(c, item.organization?.id)))
            throw new api_exception_1.ApiException(404, "QUESTION_BANK_ITEM_NOT_FOUND", "One or more exam-bank items were not found.");
        const existing = await this.items.find({
            where: { sourceQuestionBankItemId: (0, typeorm_2.In)(ids), bankType: "quiz" },
            relations: { organization: true },
        });
        const existingKeys = new Set(existing.map((item) => `${item.organization?.id || ""}:${item.sourceQuestionBankItemId || ""}`));
        const copies = sources.filter((item) => !existingKeys.has(`${item.organization?.id || ""}:${item.id}`));
        const created = await this.items.save(copies.map(({ id, organization, archivedAt, createdAt, updatedAt, ...item }) => this.items.create({
            ...item,
            organization,
            bankType: "quiz",
            sourceQuestionBankItemId: id,
        })));
        return {
            created: created.length,
            skipped: sources.length - created.length,
            items: created,
        };
    }
    allowed(c, id) {
        return (c.roles.includes("PLATFORM_ADMIN") ||
            (!!id && this.authz.canAccessOrganization(c, id, "question_bank.manage")));
    }
    assertBankType(bankType) {
        if (bankType !== "exam" && bankType !== "quiz")
            throw new api_exception_1.ApiException(400, "INVALID_QUESTION_BANK", "Unknown question-bank type.");
    }
    normalizeDraft(c, body, bankType, fallbackOrganizationId = "") {
        const organizationId = String(body.organizationId ||
            fallbackOrganizationId ||
            c.organizationIds[0] ||
            "").trim();
        if (!this.allowed(c, organizationId))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "Organization access is required.");
        const options = Array.isArray(body.options)
            ? body.options.map(String).map((value) => value.trim())
            : [];
        const correctAnswer = String(body.correctAnswer || "").trim();
        if (!String(body.text || "").trim() ||
            options.length !== 4 ||
            options.some((value) => !value) ||
            new Set(options.map((value) => value.toLowerCase())).size !== 4 ||
            !options.includes(correctAnswer))
            throw new api_exception_1.ApiException(400, "INVALID_QUESTION", "A question, four unique options, and a valid correct answer are required.");
        return {
            text: String(body.text).trim(),
            options,
            correctAnswer,
            bankType,
            organization: { id: organizationId },
            explanation: String(body.explanation || ""),
            subject: String(body.subject || ""),
            topic: String(body.topic || ""),
            book: String(body.book || ""),
            grade: String(body.grade || ""),
            chapter: String(body.chapter || ""),
            lesson: String(body.lesson || ""),
            difficulty: String(body.difficulty || "medium"),
            source: String(body.source || ""),
            tags: Array.isArray(body.tags)
                ? body.tags
                    .map(String)
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                : [],
        };
    }
    transferQuestion(item) {
        return {
            organizationId: item.organization?.id || "",
            text: item.text,
            options: item.options,
            correctAnswer: item.correctAnswer,
            explanation: item.explanation,
            subject: item.subject,
            topic: item.topic,
            book: item.book,
            grade: item.grade,
            chapter: item.chapter,
            lesson: item.lesson,
            difficulty: item.difficulty,
            source: item.source,
            tags: item.tags,
        };
    }
    sampleQuestion(organizationId) {
        return {
            organizationId,
            text: "حاصل ۲ + ۲ کدام است؟",
            options: ["۱", "۲", "۳", "۴"],
            correctAnswer: "۴",
            explanation: "جمع دو و دو برابر چهار است.",
            subject: "ریاضی",
            topic: "اعداد",
            book: "",
            grade: "",
            chapter: "",
            lesson: "",
            difficulty: "easy",
            source: "نمونه آموزشی",
            tags: ["نمونه", "ریاضی"],
        };
    }
    requestedCounts(dto) {
        return {
            easy: dto.easy || 0,
            medium: dto.medium || 0,
            hard: dto.hard || 0,
        };
    }
    pickBalanced(pool, dto) {
        const counts = this.requestedCounts(dto);
        const chosen = [];
        for (const [difficulty, count] of Object.entries(counts)) {
            const options = pool.filter((item) => item.difficulty === difficulty);
            for (let index = 0; index < count && index < options.length; index++)
                chosen.push(options[index]);
        }
        return chosen;
    }
};
exports.QuestionBankService = QuestionBankService;
exports.QuestionBankService = QuestionBankService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_bank_item_entity_1.QuestionBankItem)),
    __param(1, (0, typeorm_1.InjectRepository)(exam_entity_1.Exam)),
    __param(2, (0, typeorm_1.InjectRepository)(question_entity_1.Question)),
    __param(3, (0, typeorm_1.InjectRepository)(quiz_entity_1.Quiz)),
    __param(4, (0, typeorm_1.InjectRepository)(quiz_question_entity_1.QuizQuestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService])
], QuestionBankService);
//# sourceMappingURL=question-bank.service.js.map