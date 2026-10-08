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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionBankItem = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
let QuestionBankItem = class QuestionBankItem {
    id;
    organization;
    text;
    options;
    correctAnswer;
    explanation;
    subject;
    topic;
    book;
    grade;
    chapter;
    lesson;
    difficulty;
    source;
    tags;
    bankType;
    sourceQuestionBankItemId;
    archivedAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: false, type: () => require("./organization.entity").Organization, nullable: true }, text: { required: true, type: () => String }, options: { required: true, type: () => [String] }, correctAnswer: { required: true, type: () => String }, explanation: { required: true, type: () => String }, subject: { required: true, type: () => String }, topic: { required: true, type: () => String }, book: { required: true, type: () => String }, grade: { required: true, type: () => String }, chapter: { required: true, type: () => String }, lesson: { required: true, type: () => String }, difficulty: { required: true, type: () => String }, source: { required: true, type: () => String }, tags: { required: true, type: () => [String] }, bankType: { required: true, description: "Exam and quiz banks are isolated source collections.", enum: ["exam", "quiz"] }, sourceQuestionBankItemId: { required: false, type: () => String, nullable: true, description: "A quiz-bank copy retains its source without linking future edits." }, archivedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.QuestionBankItem = QuestionBankItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], QuestionBankItem.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Array)
], QuestionBankItem.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "correctAnswer", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "explanation", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "topic", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "book", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "chapter", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "lesson", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], QuestionBankItem.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", default: "exam" }),
    __metadata("design:type", String)
], QuestionBankItem.prototype, "bankType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], QuestionBankItem.prototype, "sourceQuestionBankItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], QuestionBankItem.prototype, "archivedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QuestionBankItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], QuestionBankItem.prototype, "updatedAt", void 0);
exports.QuestionBankItem = QuestionBankItem = __decorate([
    (0, typeorm_1.Entity)("question_bank_items"),
    (0, typeorm_1.Index)(["organization", "archivedAt"])
], QuestionBankItem);
//# sourceMappingURL=question-bank-item.entity.js.map