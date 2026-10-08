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
exports.Quiz = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const exam_entity_1 = require("./exam.entity");
const organization_entity_1 = require("./organization.entity");
const quiz_question_entity_1 = require("./quiz-question.entity");
let Quiz = class Quiz {
    id;
    title;
    subject;
    durationMinutes;
    active;
    attemptLimit;
    openAt;
    closeAt;
    resultPolicy;
    resultsReleasedAt;
    audienceRules;
    exam;
    organization;
    questions;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, title: { required: true, type: () => String }, subject: { required: true, type: () => String }, durationMinutes: { required: true, type: () => Number }, active: { required: true, type: () => Boolean }, attemptLimit: { required: true, type: () => Number }, openAt: { required: false, type: () => Date, nullable: true }, closeAt: { required: false, type: () => Date, nullable: true }, resultPolicy: { required: true, enum: ["immediate", "manual"] }, resultsReleasedAt: { required: false, type: () => Date, nullable: true }, audienceRules: { required: true, type: () => ({ gradeIds: { required: true, type: () => [Number] }, educationTypeIds: { required: true, type: () => [String] }, trackIds: { required: true, type: () => [String] }, learnerProfiles: { required: true, type: () => [String] }, independentTypes: { required: true, type: () => [String] } }) }, exam: { required: false, type: () => require("./exam.entity").Exam, nullable: true }, organization: { required: false, type: () => require("./organization.entity").Organization, nullable: true }, questions: { required: true, type: () => [require("./quiz-question.entity").QuizQuestion] }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.Quiz = Quiz;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Quiz.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 220 }),
    __metadata("design:type", String)
], Quiz.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Quiz.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 20 }),
    __metadata("design:type", Number)
], Quiz.prototype, "durationMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Quiz.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Quiz.prototype, "attemptLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Quiz.prototype, "openAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Quiz.prototype, "closeAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "immediate" }),
    __metadata("design:type", String)
], Quiz.prototype, "resultPolicy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Quiz.prototype, "resultsReleasedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "simple-json",
        default: '{"gradeIds":[],"educationTypeIds":[],"trackIds":[],"learnerProfiles":[],"independentTypes":[]}',
    }),
    __metadata("design:type", Object)
], Quiz.prototype, "audienceRules", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => exam_entity_1.Exam, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], Quiz.prototype, "exam", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], Quiz.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => quiz_question_entity_1.QuizQuestion, (q) => q.quiz, { cascade: true }),
    __metadata("design:type", Array)
], Quiz.prototype, "questions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Quiz.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Quiz.prototype, "updatedAt", void 0);
exports.Quiz = Quiz = __decorate([
    (0, typeorm_1.Entity)("quizzes")
], Quiz);
//# sourceMappingURL=quiz.entity.js.map