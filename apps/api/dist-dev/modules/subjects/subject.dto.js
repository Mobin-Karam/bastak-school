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
exports.AssignTeacherSubjectDto = exports.UpdateStudentSubjectDto = exports.ArchiveSubjectDto = exports.ImportSubjectsDto = exports.UpdateSubjectDto = exports.CreateSubjectDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateSubjectDto {
    code;
    name;
    category;
    organizationId;
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => String, minLength: 1, maxLength: 80 }, name: { required: true, type: () => String, minLength: 2, maxLength: 160 }, category: { required: false, type: () => String, minLength: 1, maxLength: 80 }, organizationId: { required: false, type: () => String, format: "uuid" } };
    }
}
exports.CreateSubjectDto = CreateSubjectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 80),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 80),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubjectDto.prototype, "organizationId", void 0);
class UpdateSubjectDto {
    name;
    category;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String, minLength: 2, maxLength: 160 }, category: { required: false, type: () => String, minLength: 1, maxLength: 80 } };
    }
}
exports.UpdateSubjectDto = UpdateSubjectDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], UpdateSubjectDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 80),
    __metadata("design:type", String)
], UpdateSubjectDto.prototype, "category", void 0);
class ImportSubjectsDto {
    subjects;
    static _OPENAPI_METADATA_FACTORY() {
        return { subjects: { required: true, type: () => [require("./subject.dto").CreateSubjectDto] } };
    }
}
exports.ImportSubjectsDto = ImportSubjectsDto;
class ArchiveSubjectDto {
    active;
    static _OPENAPI_METADATA_FACTORY() {
        return { active: { required: true, type: () => Boolean } };
    }
}
exports.ArchiveSubjectDto = ArchiveSubjectDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ArchiveSubjectDto.prototype, "active", void 0);
class UpdateStudentSubjectDto {
    enabled;
    displayName;
    weeklyTargetMinutes;
    static _OPENAPI_METADATA_FACTORY() {
        return { enabled: { required: false, type: () => Boolean }, displayName: { required: false, type: () => String, minLength: 0, maxLength: 120 }, weeklyTargetMinutes: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.UpdateStudentSubjectDto = UpdateStudentSubjectDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateStudentSubjectDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 120),
    __metadata("design:type", String)
], UpdateStudentSubjectDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateStudentSubjectDto.prototype, "weeklyTargetMinutes", void 0);
class AssignTeacherSubjectDto {
    teacherId;
    organizationId;
    static _OPENAPI_METADATA_FACTORY() {
        return { teacherId: { required: true, type: () => String, format: "uuid" }, organizationId: { required: true, type: () => String, format: "uuid" } };
    }
}
exports.AssignTeacherSubjectDto = AssignTeacherSubjectDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignTeacherSubjectDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignTeacherSubjectDto.prototype, "organizationId", void 0);
//# sourceMappingURL=subject.dto.js.map