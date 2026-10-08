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
exports.SubmitQuizDto = exports.QuizAnswerDto = exports.QuizAudienceRulesDto = exports.QuizClassAssignmentsDto = exports.QuizAssignmentsDto = exports.UpdateQuizDto = exports.CreateQuizDto = exports.QuizQuestionDto = exports.ModerateRetryDto = exports.RetryRequestDto = exports.SyllabusProgressDto = exports.SyllabusDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const exam_retry_request_entity_1 = require("../../../database/entities/exam-retry-request.entity");
const syllabus_progress_entity_1 = require("../../../database/entities/syllabus-progress.entity");
class SyllabusDto {
    subject;
    description;
    required;
    track;
    static _OPENAPI_METADATA_FACTORY() {
        return { subject: { required: true, type: () => String }, description: { required: false, type: () => String }, required: { required: false, type: () => Boolean }, track: { required: false, type: () => String } };
    }
}
exports.SyllabusDto = SyllabusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyllabusDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyllabusDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SyllabusDto.prototype, "required", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyllabusDto.prototype, "track", void 0);
class SyllabusProgressDto {
    status;
    accuracy;
    note;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, enum: require("../../../database/entities/syllabus-progress.entity").SyllabusProgressStatus }, accuracy: { required: false, type: () => Number, minimum: 0, maximum: 100 }, note: { required: false, type: () => String } };
    }
}
exports.SyllabusProgressDto = SyllabusProgressDto;
__decorate([
    (0, class_validator_1.IsEnum)(syllabus_progress_entity_1.SyllabusProgressStatus),
    __metadata("design:type", String)
], SyllabusProgressDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SyllabusProgressDto.prototype, "accuracy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SyllabusProgressDto.prototype, "note", void 0);
class RetryRequestDto {
    message;
    static _OPENAPI_METADATA_FACTORY() {
        return { message: { required: false, type: () => String } };
    }
}
exports.RetryRequestDto = RetryRequestDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RetryRequestDto.prototype, "message", void 0);
class ModerateRetryDto {
    status;
    note;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, enum: require("../../../database/entities/exam-retry-request.entity").RetryRequestStatus }, note: { required: false, type: () => String } };
    }
}
exports.ModerateRetryDto = ModerateRetryDto;
__decorate([
    (0, class_validator_1.IsEnum)(exam_retry_request_entity_1.RetryRequestStatus),
    __metadata("design:type", String)
], ModerateRetryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ModerateRetryDto.prototype, "note", void 0);
class QuizQuestionDto {
    text;
    options;
    correctAnswer;
    explanation;
    sortOrder;
    static _OPENAPI_METADATA_FACTORY() {
        return { text: { required: true, type: () => String }, options: { required: true, type: () => [String] }, correctAnswer: { required: true, type: () => String }, explanation: { required: false, type: () => String }, sortOrder: { required: false, type: () => Number } };
    }
}
exports.QuizQuestionDto = QuizQuestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuizQuestionDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], QuizQuestionDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuizQuestionDto.prototype, "correctAnswer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuizQuestionDto.prototype, "explanation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QuizQuestionDto.prototype, "sortOrder", void 0);
class CreateQuizDto {
    title;
    subject;
    durationMinutes;
    examId;
    organizationId;
    active;
    attemptLimit;
    openAt;
    closeAt;
    resultPolicy;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String }, subject: { required: false, type: () => String }, durationMinutes: { required: false, type: () => Number, minimum: 1 }, examId: { required: false, type: () => String, format: "uuid" }, organizationId: { required: false, type: () => String, format: "uuid" }, active: { required: false, type: () => Boolean }, attemptLimit: { required: false, type: () => Number, minimum: 1 }, openAt: { required: false, type: () => String, nullable: true }, closeAt: { required: false, type: () => String, nullable: true }, resultPolicy: { required: false, enum: ["immediate", "manual"], enum: ["immediate", "manual"] } };
    }
}
exports.CreateQuizDto = CreateQuizDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuizDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuizDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateQuizDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuizDto.prototype, "examId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateQuizDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateQuizDto.prototype, "active", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateQuizDto.prototype, "attemptLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], CreateQuizDto.prototype, "openAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], CreateQuizDto.prototype, "closeAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["immediate", "manual"]),
    __metadata("design:type", String)
], CreateQuizDto.prototype, "resultPolicy", void 0);
class UpdateQuizDto {
    title;
    subject;
    durationMinutes;
    active;
    attemptLimit;
    openAt;
    closeAt;
    resultPolicy;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: false, type: () => String }, subject: { required: false, type: () => String }, durationMinutes: { required: false, type: () => Number, minimum: 1 }, active: { required: false, type: () => Boolean }, attemptLimit: { required: false, type: () => Number, minimum: 1 }, openAt: { required: false, type: () => String, nullable: true }, closeAt: { required: false, type: () => String, nullable: true }, resultPolicy: { required: false, enum: ["immediate", "manual"], enum: ["immediate", "manual"] } };
    }
}
exports.UpdateQuizDto = UpdateQuizDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuizDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuizDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateQuizDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateQuizDto.prototype, "active", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateQuizDto.prototype, "attemptLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], UpdateQuizDto.prototype, "openAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], UpdateQuizDto.prototype, "closeAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["immediate", "manual"]),
    __metadata("design:type", String)
], UpdateQuizDto.prototype, "resultPolicy", void 0);
class QuizAssignmentsDto {
    studentIds;
    static _OPENAPI_METADATA_FACTORY() {
        return { studentIds: { required: true, type: () => [String], format: "uuid" } };
    }
}
exports.QuizAssignmentsDto = QuizAssignmentsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], QuizAssignmentsDto.prototype, "studentIds", void 0);
class QuizClassAssignmentsDto {
    classIds;
    static _OPENAPI_METADATA_FACTORY() {
        return { classIds: { required: true, type: () => [String], format: "uuid" } };
    }
}
exports.QuizClassAssignmentsDto = QuizClassAssignmentsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], QuizClassAssignmentsDto.prototype, "classIds", void 0);
class QuizAudienceRulesDto {
    gradeIds;
    educationTypeIds;
    trackIds;
    learnerProfiles;
    independentTypes;
    static _OPENAPI_METADATA_FACTORY() {
        return { gradeIds: { required: true, type: () => [Number], minimum: 1 }, educationTypeIds: { required: true, type: () => [String] }, trackIds: { required: true, type: () => [String] }, learnerProfiles: { required: true, type: () => [String], enum: ["school", "independent"], isArray: true }, independentTypes: { required: true, type: () => [String], enum: ["adult", "gap_year", "homeschool", "other"], isArray: true } };
    }
}
exports.QuizAudienceRulesDto = QuizAudienceRulesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    __metadata("design:type", Array)
], QuizAudienceRulesDto.prototype, "gradeIds", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], QuizAudienceRulesDto.prototype, "educationTypeIds", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], QuizAudienceRulesDto.prototype, "trackIds", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(["school", "independent"], { each: true }),
    __metadata("design:type", Array)
], QuizAudienceRulesDto.prototype, "learnerProfiles", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(["adult", "gap_year", "homeschool", "other"], { each: true }),
    __metadata("design:type", Array)
], QuizAudienceRulesDto.prototype, "independentTypes", void 0);
class QuizAnswerDto {
    questionId;
    selectedOption;
    static _OPENAPI_METADATA_FACTORY() {
        return { questionId: { required: true, type: () => String, format: "uuid" }, selectedOption: { required: false, type: () => String, nullable: true } };
    }
}
exports.QuizAnswerDto = QuizAnswerDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QuizAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], QuizAnswerDto.prototype, "selectedOption", void 0);
class SubmitQuizDto {
    runId;
    answers;
    static _OPENAPI_METADATA_FACTORY() {
        return { runId: { required: true, type: () => String, format: "uuid" }, answers: { required: true, type: () => [require("./assessment.dto").QuizAnswerDto] } };
    }
}
exports.SubmitQuizDto = SubmitQuizDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitQuizDto.prototype, "runId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuizAnswerDto),
    __metadata("design:type", Array)
], SubmitQuizDto.prototype, "answers", void 0);
//# sourceMappingURL=assessment.dto.js.map