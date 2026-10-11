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
exports.CommitStudentImportDto = exports.PreviewStudentImportDto = exports.StudentImportRowDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const onboarding_1 = require("../onboarding");
class StudentImportRowDto {
    firstName;
    lastName;
    nationalCode;
    gradeId;
    educationTypeId;
    trackId;
    static _OPENAPI_METADATA_FACTORY() {
        return { firstName: { required: true, type: () => String, maxLength: 100 }, lastName: { required: true, type: () => String, maxLength: 100 }, nationalCode: { required: false, type: () => String, pattern: "^\\d{10}$" }, gradeId: { required: false, type: () => Number, minimum: 1, maximum: 12 }, educationTypeId: { required: false, type: () => String, maxLength: 40 }, trackId: { required: false, type: () => String, maxLength: 80 } };
    }
}
exports.StudentImportRowDto = StudentImportRowDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], StudentImportRowDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], StudentImportRowDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value ? (0, onboarding_1.normalizeNationalCode)(String(value)) : undefined),
    (0, class_validator_1.Matches)(/^\d{10}$/),
    __metadata("design:type", String)
], StudentImportRowDto.prototype, "nationalCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], StudentImportRowDto.prototype, "gradeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], StudentImportRowDto.prototype, "educationTypeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], StudentImportRowDto.prototype, "trackId", void 0);
class PreviewStudentImportDto {
    organizationId;
    rows;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, rows: { required: true, type: () => [require("./student-transfer.dto").StudentImportRowDto], maxItems: 500 } };
    }
}
exports.PreviewStudentImportDto = PreviewStudentImportDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PreviewStudentImportDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(500),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StudentImportRowDto),
    __metadata("design:type", Array)
], PreviewStudentImportDto.prototype, "rows", void 0);
class CommitStudentImportDto extends PreviewStudentImportDto {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.CommitStudentImportDto = CommitStudentImportDto;
//# sourceMappingURL=student-transfer.dto.js.map