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
exports.ExamAudienceRulesDto = exports.ExamClassAssignmentsDto = exports.AssignExamDto = exports.UpdateExamDto = exports.CreateExamDto = exports.CreateQuestionDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mapped_types_1 = require("@nestjs/mapped-types");
class CreateQuestionDto {
    text;
    question;
    options;
    correctAnswer;
    correctOption;
    explanation;
    subject;
    topic;
    sectionId;
    mediaUrl;
    difficulty;
    source;
    tags;
    static _OPENAPI_METADATA_FACTORY() {
        return { text: { required: false, type: () => String }, question: { required: false, type: () => String }, options: { required: true, type: () => [String] }, correctAnswer: { required: false, type: () => String }, correctOption: { required: false, type: () => String }, explanation: { required: false, type: () => String }, subject: { required: false, type: () => String }, topic: { required: false, type: () => String }, sectionId: { required: false, type: () => String }, mediaUrl: { required: false, type: () => String }, difficulty: { required: false, type: () => String }, source: { required: false, type: () => String }, tags: { required: false, type: () => [String] } };
    }
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "question", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateQuestionDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "correctAnswer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "correctOption", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "explanation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "topic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "sectionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "mediaUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateQuestionDto.prototype, "tags", void 0);
class CreateExamDto {
    title;
    subject;
    duration;
    durationMinutes;
    attemptLimit;
    startTime;
    endTime;
    openAt;
    closeAt;
    isoDate;
    studentId;
    organizationId;
    published;
    mode;
    description;
    lifecycleStatus;
    navigationMode;
    timerMode;
    allowResume;
    allowLateStart;
    allowPracticeAfterDeadline;
    autoSubmitOnTimeout;
    sessionPolicy;
    integrityMonitoring;
    latestStartAt;
    answerKeyReleaseAt;
    explanationReleaseAt;
    rankingReleaseAt;
    instructions;
    allowBackNavigation;
    scoring;
    resultPolicy;
    resultReleaseAt;
    resultsReleased;
    sections;
    questions;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String }, subject: { required: false, type: () => String }, duration: { required: false, type: () => Number, minimum: 1 }, durationMinutes: { required: false, type: () => Number, minimum: 1 }, attemptLimit: { required: false, type: () => Number, minimum: 1 }, startTime: { required: false, type: () => String }, endTime: { required: false, type: () => String }, openAt: { required: false, type: () => String }, closeAt: { required: false, type: () => String }, isoDate: { required: false, type: () => String }, studentId: { required: false, type: () => String }, organizationId: { required: false, type: () => String, format: "uuid" }, published: { required: false, type: () => Boolean }, mode: { required: false, enum: ["konkur", "mock", "practice", "quiz", "diagnostic"], enum: ["konkur", "mock", "practice", "quiz", "diagnostic"] }, description: { required: false, type: () => String }, lifecycleStatus: { required: false, enum: ["scheduled", "draft", "cancelled"], enum: ["draft", "scheduled", "cancelled"] }, navigationMode: { required: false, enum: ["free", "section_only", "sequential"], enum: ["free", "section_only", "sequential"] }, timerMode: { required: false, enum: ["whole_exam", "per_section"], enum: ["whole_exam", "per_section"] }, allowResume: { required: false, type: () => Boolean }, allowLateStart: { required: false, type: () => Boolean }, allowPracticeAfterDeadline: { required: false, type: () => Boolean }, autoSubmitOnTimeout: { required: false, type: () => Boolean }, sessionPolicy: { required: false, enum: ["allow_resume", "single_session"], enum: ["single_session", "allow_resume"] }, integrityMonitoring: { required: false, type: () => Boolean }, latestStartAt: { required: false, type: () => String }, answerKeyReleaseAt: { required: false, type: () => String }, explanationReleaseAt: { required: false, type: () => String }, rankingReleaseAt: { required: false, type: () => String }, instructions: { required: false, type: () => [String] }, allowBackNavigation: { required: false, type: () => Boolean }, scoring: { required: false, type: () => ({ correct: { required: true, type: () => Number }, wrong: { required: true, type: () => Number }, unanswered: { required: true, type: () => Number }, negativeMarking: { required: true, type: () => Boolean } }) }, resultPolicy: { required: false, enum: ["scheduled", "immediate", "manual"], enum: ["immediate", "scheduled", "manual"] }, resultReleaseAt: { required: false, type: () => String }, resultsReleased: { required: false, type: () => Boolean }, sections: { required: false }, questions: { required: false, type: () => [require("./create-exam.dto").CreateQuestionDto] } };
    }
}
exports.CreateExamDto = CreateExamDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateExamDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateExamDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateExamDto.prototype, "attemptLimit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "openAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "closeAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "isoDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateExamDto.prototype, "published", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["konkur", "mock", "practice", "quiz", "diagnostic"]),
    __metadata("design:type", String)
], CreateExamDto.prototype, "mode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["draft", "scheduled", "cancelled"]),
    __metadata("design:type", String)
], CreateExamDto.prototype, "lifecycleStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["free", "section_only", "sequential"]),
    __metadata("design:type", String)
], CreateExamDto.prototype, "navigationMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["whole_exam", "per_section"]),
    __metadata("design:type", String)
], CreateExamDto.prototype, "timerMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateExamDto.prototype, "allowResume", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateExamDto.prototype, "allowLateStart", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateExamDto.prototype, "allowPracticeAfterDeadline", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateExamDto.prototype, "autoSubmitOnTimeout", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["single_session", "allow_resume"]),
    __metadata("design:type", String)
], CreateExamDto.prototype, "sessionPolicy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateExamDto.prototype, "integrityMonitoring", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "latestStartAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "answerKeyReleaseAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "explanationReleaseAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "rankingReleaseAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateExamDto.prototype, "instructions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateExamDto.prototype, "allowBackNavigation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateExamDto.prototype, "scoring", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["immediate", "scheduled", "manual"]),
    __metadata("design:type", String)
], CreateExamDto.prototype, "resultPolicy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExamDto.prototype, "resultReleaseAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateExamDto.prototype, "resultsReleased", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateExamDto.prototype, "sections", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateQuestionDto),
    __metadata("design:type", Array)
], CreateExamDto.prototype, "questions", void 0);
class UpdateExamDto extends (0, mapped_types_1.PartialType)(CreateExamDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateExamDto = UpdateExamDto;
class AssignExamDto {
    studentIds;
    static _OPENAPI_METADATA_FACTORY() {
        return { studentIds: { required: true, type: () => [String], format: "uuid" } };
    }
}
exports.AssignExamDto = AssignExamDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], AssignExamDto.prototype, "studentIds", void 0);
class ExamClassAssignmentsDto {
    classIds;
    static _OPENAPI_METADATA_FACTORY() {
        return { classIds: { required: true, type: () => [String], format: "uuid" } };
    }
}
exports.ExamClassAssignmentsDto = ExamClassAssignmentsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], ExamClassAssignmentsDto.prototype, "classIds", void 0);
class ExamAudienceRulesDto {
    gradeIds;
    educationTypeIds;
    trackIds;
    learnerProfiles;
    independentTypes;
    static _OPENAPI_METADATA_FACTORY() {
        return { gradeIds: { required: true, type: () => [Number], minimum: 1 }, educationTypeIds: { required: true, type: () => [String] }, trackIds: { required: true, type: () => [String] }, learnerProfiles: { required: true, type: () => [String], enum: ["school", "independent"], isArray: true }, independentTypes: { required: true, type: () => [String], enum: ["adult", "gap_year", "homeschool", "other"], isArray: true } };
    }
}
exports.ExamAudienceRulesDto = ExamAudienceRulesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    __metadata("design:type", Array)
], ExamAudienceRulesDto.prototype, "gradeIds", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExamAudienceRulesDto.prototype, "educationTypeIds", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExamAudienceRulesDto.prototype, "trackIds", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(["school", "independent"], { each: true }),
    __metadata("design:type", Array)
], ExamAudienceRulesDto.prototype, "learnerProfiles", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsIn)(["adult", "gap_year", "homeschool", "other"], { each: true }),
    __metadata("design:type", Array)
], ExamAudienceRulesDto.prototype, "independentTypes", void 0);
//# sourceMappingURL=create-exam.dto.js.map