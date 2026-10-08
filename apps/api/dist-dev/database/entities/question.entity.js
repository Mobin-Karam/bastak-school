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
exports.Question = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const exam_entity_1 = require("./exam.entity");
let Question = class Question {
    id;
    exam;
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
    subtopic;
    questionType;
    weight;
    sectionId;
    mediaUrl;
    difficulty;
    source;
    questionBankItemId;
    sortOrder;
    tags;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, exam: { required: true, type: () => require("./exam.entity").Exam }, text: { required: true, type: () => String }, options: { required: true, type: () => [String] }, correctAnswer: { required: true, type: () => String }, explanation: { required: true, type: () => String }, subject: { required: true, type: () => String }, topic: { required: true, type: () => String }, book: { required: true, type: () => String }, grade: { required: true, type: () => String }, chapter: { required: true, type: () => String }, lesson: { required: true, type: () => String }, subtopic: { required: true, type: () => String }, questionType: { required: true, type: () => String }, weight: { required: true, type: () => Number }, sectionId: { required: true, type: () => String }, mediaUrl: { required: true, type: () => String }, difficulty: { required: true, type: () => String }, source: { required: true, type: () => String }, questionBankItemId: { required: false, type: () => String, nullable: true }, sortOrder: { required: true, type: () => Number }, tags: { required: true, type: () => [String] } };
    }
};
exports.Question = Question;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Question.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => exam_entity_1.Exam, (exam) => exam.questions, { onDelete: "CASCADE" }),
    __metadata("design:type", exam_entity_1.Exam)
], Question.prototype, "exam", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Question.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Array)
], Question.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Question.prototype, "correctAnswer", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "explanation", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "topic", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "book", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "chapter", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "lesson", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "subtopic", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "multiple_choice" }),
    __metadata("design:type", String)
], Question.prototype, "questionType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", default: 1 }),
    __metadata("design:type", Number)
], Question.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "sectionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "mediaUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "medium" }),
    __metadata("design:type", String)
], Question.prototype, "difficulty", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Question.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Question.prototype, "questionBankItemId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Question.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], Question.prototype, "tags", void 0);
exports.Question = Question = __decorate([
    (0, typeorm_1.Entity)("questions")
], Question);
//# sourceMappingURL=question.entity.js.map