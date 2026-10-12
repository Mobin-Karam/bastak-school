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
exports.QuizQuestion = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const quiz_entity_1 = require("./quiz.entity");
let QuizQuestion = class QuizQuestion {
    id;
    quiz;
    text;
    options;
    correctAnswer;
    explanation;
    sortOrder;
    questionBankItemId;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, quiz: { required: true, type: () => require("./quiz.entity").Quiz }, text: { required: true, type: () => String }, options: { required: true, type: () => [String] }, correctAnswer: { required: true, type: () => String }, explanation: { required: true, type: () => String }, sortOrder: { required: true, type: () => Number }, questionBankItemId: { required: false, type: () => String, nullable: true } };
    }
};
exports.QuizQuestion = QuizQuestion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], QuizQuestion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => quiz_entity_1.Quiz, (q) => q.questions, {
        nullable: false,
        onDelete: "CASCADE",
    }),
    __metadata("design:type", quiz_entity_1.Quiz)
], QuizQuestion.prototype, "quiz", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuizQuestion.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Array)
], QuizQuestion.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], QuizQuestion.prototype, "correctAnswer", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], QuizQuestion.prototype, "explanation", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], QuizQuestion.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], QuizQuestion.prototype, "questionBankItemId", void 0);
exports.QuizQuestion = QuizQuestion = __decorate([
    (0, typeorm_1.Entity)("quiz_questions")
], QuizQuestion);
//# sourceMappingURL=quiz-question.entity.js.map