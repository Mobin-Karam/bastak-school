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
exports.QuizAttempt = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const quiz_entity_1 = require("./quiz.entity");
const student_entity_1 = require("./student.entity");
let QuizAttempt = class QuizAttempt {
    id;
    quiz;
    student;
    startedAt;
    submittedAt;
    answers;
    correct;
    wrong;
    blank;
    percent;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, quiz: { required: true, type: () => require("./quiz.entity").Quiz }, student: { required: true, type: () => require("./student.entity").Student }, startedAt: { required: true, type: () => Date }, submittedAt: { required: false, type: () => Date, nullable: true }, answers: { required: true }, correct: { required: true, type: () => Number }, wrong: { required: true, type: () => Number }, blank: { required: true, type: () => Number }, percent: { required: true, type: () => Number } };
    }
};
exports.QuizAttempt = QuizAttempt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], QuizAttempt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => quiz_entity_1.Quiz, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", quiz_entity_1.Quiz)
], QuizAttempt.prototype, "quiz", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], QuizAttempt.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], QuizAttempt.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], QuizAttempt.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], QuizAttempt.prototype, "answers", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], QuizAttempt.prototype, "correct", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], QuizAttempt.prototype, "wrong", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], QuizAttempt.prototype, "blank", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], QuizAttempt.prototype, "percent", void 0);
exports.QuizAttempt = QuizAttempt = __decorate([
    (0, typeorm_1.Entity)("quiz_attempts")
], QuizAttempt);
//# sourceMappingURL=quiz-attempt.entity.js.map