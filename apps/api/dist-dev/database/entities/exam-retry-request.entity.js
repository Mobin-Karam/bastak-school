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
exports.ExamRetryRequest = exports.RetryRequestStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const exam_entity_1 = require("./exam.entity");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
var RetryRequestStatus;
(function (RetryRequestStatus) {
    RetryRequestStatus["PENDING"] = "pending";
    RetryRequestStatus["APPROVED"] = "approved";
    RetryRequestStatus["REJECTED"] = "rejected";
})(RetryRequestStatus || (exports.RetryRequestStatus = RetryRequestStatus = {}));
let ExamRetryRequest = class ExamRetryRequest {
    id;
    exam;
    student;
    message;
    status;
    moderatorNote;
    resolvedBy;
    resolvedAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, exam: { required: true, type: () => require("./exam.entity").Exam }, student: { required: true, type: () => require("./student.entity").Student }, message: { required: true, type: () => String }, status: { required: true, enum: require("./exam-retry-request.entity").RetryRequestStatus }, moderatorNote: { required: true, type: () => String }, resolvedBy: { required: false, type: () => require("./user.entity").User, nullable: true }, resolvedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.ExamRetryRequest = ExamRetryRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ExamRetryRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => exam_entity_1.Exam, { onDelete: "CASCADE" }),
    __metadata("design:type", exam_entity_1.Exam)
], ExamRetryRequest.prototype, "exam", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], ExamRetryRequest.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], ExamRetryRequest.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: RetryRequestStatus.PENDING }),
    __metadata("design:type", String)
], ExamRetryRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], ExamRetryRequest.prototype, "moderatorNote", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], ExamRetryRequest.prototype, "resolvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ExamRetryRequest.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ExamRetryRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ExamRetryRequest.prototype, "updatedAt", void 0);
exports.ExamRetryRequest = ExamRetryRequest = __decorate([
    (0, typeorm_1.Entity)("exam_retry_requests")
], ExamRetryRequest);
//# sourceMappingURL=exam-retry-request.entity.js.map