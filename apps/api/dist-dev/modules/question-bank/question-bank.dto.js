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
exports.GenerateExamFromBankDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class GenerateExamFromBankDto {
    examId;
    subject;
    topic;
    grade;
    chapter;
    easy;
    medium;
    hard;
    itemIds;
    commit;
    static _OPENAPI_METADATA_FACTORY() {
        return { examId: { required: true, type: () => String, format: "uuid" }, subject: { required: false, type: () => String }, topic: { required: false, type: () => String }, grade: { required: false, type: () => String }, chapter: { required: false, type: () => String }, easy: { required: false, type: () => Number, minimum: 0 }, medium: { required: false, type: () => Number, minimum: 0 }, hard: { required: false, type: () => Number, minimum: 0 }, itemIds: { required: false, type: () => [String], format: "uuid" }, commit: { required: false, type: () => Boolean } };
    }
}
exports.GenerateExamFromBankDto = GenerateExamFromBankDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateExamFromBankDto.prototype, "examId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateExamFromBankDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateExamFromBankDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateExamFromBankDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateExamFromBankDto.prototype, "chapter", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GenerateExamFromBankDto.prototype, "easy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GenerateExamFromBankDto.prototype, "medium", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GenerateExamFromBankDto.prototype, "hard", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], GenerateExamFromBankDto.prototype, "itemIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], GenerateExamFromBankDto.prototype, "commit", void 0);
//# sourceMappingURL=question-bank.dto.js.map