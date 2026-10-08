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
exports.ImportPlanDto = exports.ImportTaskDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ImportTaskDto {
    type;
    title;
    description;
    subject;
    startTime;
    start;
    endTime;
    end;
    duration;
    testCount;
    priority;
    note;
    pages;
    examRef;
    examId;
    conflict;
    conflictGroup;
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => String }, title: { required: true, type: () => String }, description: { required: false, type: () => String }, subject: { required: false, type: () => String }, startTime: { required: false, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, start: { required: false, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, endTime: { required: false, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, end: { required: false, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, duration: { required: false, type: () => Number }, testCount: { required: false, type: () => Number }, priority: { required: false, type: () => Number }, note: { required: false, type: () => String }, pages: { required: false, type: () => String }, examRef: { required: false, type: () => String }, examId: { required: false, type: () => String }, conflict: { required: false, type: () => Boolean }, conflictGroup: { required: false, type: () => String } };
    }
}
exports.ImportTaskDto = ImportTaskDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "startTime must use HH:mm" }),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "start must use HH:mm" }),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "start", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "endTime must use HH:mm" }),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "end must use HH:mm" }),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "end", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ImportTaskDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ImportTaskDto.prototype, "testCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ImportTaskDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "pages", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "examRef", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "examId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ImportTaskDto.prototype, "conflict", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportTaskDto.prototype, "conflictGroup", void 0);
class ImportPlanDto {
    studentId;
    date;
    planDate;
    tasks;
    publish;
    title;
    dayLabel;
    persianDate;
    jalaliId;
    motivationText;
    templateId;
    templateVersion;
    static _OPENAPI_METADATA_FACTORY() {
        return { studentId: { required: true, type: () => String }, date: { required: false, type: () => String }, planDate: { required: false, type: () => String }, tasks: { required: true, type: () => [require("./import-plan.dto").ImportTaskDto] }, publish: { required: false, type: () => Boolean }, title: { required: false, type: () => String }, dayLabel: { required: false, type: () => String }, persianDate: { required: false, type: () => String }, jalaliId: { required: false, type: () => String }, motivationText: { required: false, type: () => String }, templateId: { required: false, type: () => String }, templateVersion: { required: false, type: () => Number, minimum: 1 } };
    }
}
exports.ImportPlanDto = ImportPlanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportPlanDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ImportPlanDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ImportPlanDto.prototype, "planDate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ImportTaskDto),
    __metadata("design:type", Array)
], ImportPlanDto.prototype, "tasks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ImportPlanDto.prototype, "publish", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportPlanDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportPlanDto.prototype, "dayLabel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportPlanDto.prototype, "persianDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportPlanDto.prototype, "jalaliId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportPlanDto.prototype, "motivationText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportPlanDto.prototype, "templateId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ImportPlanDto.prototype, "templateVersion", void 0);
//# sourceMappingURL=import-plan.dto.js.map