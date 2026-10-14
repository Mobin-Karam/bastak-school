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
exports.ExamAttempt = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const exam_entity_1 = require("./exam.entity");
const student_entity_1 = require("./student.entity");
let ExamAttempt = class ExamAttempt {
    id;
    exam;
    student;
    score;
    status;
    expiresAt;
    submittedAt;
    lastHeartbeatAt;
    currentSectionId;
    rawScore;
    percentage;
    correctCount;
    incorrectCount;
    unansweredCount;
    answers;
    startedAt;
    finishedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, exam: { required: true, type: () => require("./exam.entity").Exam }, student: { required: true, type: () => require("./student.entity").Student }, score: { required: true, type: () => Number }, status: { required: true, enum: ["cancelled", "active", "submitted", "expired"] }, expiresAt: { required: false, type: () => Date, nullable: true }, submittedAt: { required: false, type: () => Date, nullable: true }, lastHeartbeatAt: { required: false, type: () => Date, nullable: true }, currentSectionId: { required: true, type: () => String }, rawScore: { required: false, type: () => Number, nullable: true }, percentage: { required: false, type: () => Number, nullable: true }, correctCount: { required: false, type: () => Number, nullable: true }, incorrectCount: { required: false, type: () => Number, nullable: true }, unansweredCount: { required: false, type: () => Number, nullable: true }, answers: { required: true }, startedAt: { required: true, type: () => Date }, finishedAt: { required: false, type: () => Date, nullable: true } };
    }
};
exports.ExamAttempt = ExamAttempt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ExamAttempt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => exam_entity_1.Exam, (exam) => exam.attempts, { onDelete: "CASCADE" }),
    __metadata("design:type", exam_entity_1.Exam)
], ExamAttempt.prototype, "exam", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.examAttempts, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], ExamAttempt.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ExamAttempt.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "active" }),
    __metadata("design:type", String)
], ExamAttempt.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExamAttempt.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExamAttempt.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExamAttempt.prototype, "lastHeartbeatAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], ExamAttempt.prototype, "currentSectionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", nullable: true }),
    __metadata("design:type", Object)
], ExamAttempt.prototype, "rawScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", nullable: true }),
    __metadata("design:type", Object)
], ExamAttempt.prototype, "percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", nullable: true }),
    __metadata("design:type", Object)
], ExamAttempt.prototype, "correctCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", nullable: true }),
    __metadata("design:type", Object)
], ExamAttempt.prototype, "incorrectCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", nullable: true }),
    __metadata("design:type", Object)
], ExamAttempt.prototype, "unansweredCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], ExamAttempt.prototype, "answers", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], ExamAttempt.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExamAttempt.prototype, "finishedAt", void 0);
exports.ExamAttempt = ExamAttempt = __decorate([
    (0, typeorm_1.Entity)("exam_attempts")
], ExamAttempt);
//# sourceMappingURL=exam-attempt.entity.js.map