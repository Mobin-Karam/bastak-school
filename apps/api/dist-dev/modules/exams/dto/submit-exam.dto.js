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
exports.ExamHeartbeatDto = exports.SubmitExamDto = exports.ExamAnswerDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ExamAnswerDto {
    questionId;
    selectedOption;
    marked;
    visited;
    clientUpdatedAt;
    revision;
    approximateTimeSpentSeconds;
    static _OPENAPI_METADATA_FACTORY() {
        return { questionId: { required: true, type: () => String }, selectedOption: { required: false, type: () => String, nullable: true, enum: ["a", "b", "c", "d"] }, marked: { required: false, type: () => Boolean }, visited: { required: false, type: () => Boolean }, clientUpdatedAt: { required: false, type: () => String }, revision: { required: false, type: () => Number, minimum: 0 }, approximateTimeSpentSeconds: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.ExamAnswerDto = ExamAnswerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExamAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["a", "b", "c", "d"]),
    __metadata("design:type", Object)
], ExamAnswerDto.prototype, "selectedOption", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExamAnswerDto.prototype, "marked", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExamAnswerDto.prototype, "visited", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ExamAnswerDto.prototype, "clientUpdatedAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ExamAnswerDto.prototype, "revision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ExamAnswerDto.prototype, "approximateTimeSpentSeconds", void 0);
class SubmitExamDto {
    answers = [];
    static _OPENAPI_METADATA_FACTORY() {
        return { answers: { required: true, type: () => [require("./submit-exam.dto").ExamAnswerDto], default: [] } };
    }
}
exports.SubmitExamDto = SubmitExamDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ExamAnswerDto),
    __metadata("design:type", Array)
], SubmitExamDto.prototype, "answers", void 0);
class ExamHeartbeatDto {
    currentSectionId;
    static _OPENAPI_METADATA_FACTORY() {
        return { currentSectionId: { required: false, type: () => String } };
    }
}
exports.ExamHeartbeatDto = ExamHeartbeatDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExamHeartbeatDto.prototype, "currentSectionId", void 0);
//# sourceMappingURL=submit-exam.dto.js.map