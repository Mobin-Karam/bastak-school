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
exports.AcademicSubjectDto = exports.EndTeachingAssignmentDto = exports.SubjectBookReferenceDto = exports.TeachingAssignmentDto = exports.AcademicPageDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class AcademicPageDto {
    offset = 0;
    limit = 50;
    teacherId;
    classroomId;
    academicYearId;
    static _OPENAPI_METADATA_FACTORY() {
        return { offset: { required: true, type: () => Object, default: 0, minimum: 0 }, limit: { required: true, type: () => Object, default: 50, minimum: 1, maximum: 100 }, teacherId: { required: false, type: () => String, format: "uuid" }, classroomId: { required: false, type: () => String, format: "uuid" }, academicYearId: { required: false, type: () => String, format: "uuid" } };
    }
}
exports.AcademicPageDto = AcademicPageDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], AcademicPageDto.prototype, "offset", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Object)
], AcademicPageDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AcademicPageDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AcademicPageDto.prototype, "classroomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AcademicPageDto.prototype, "academicYearId", void 0);
class TeachingAssignmentDto {
    academicYearId;
    termId;
    classroomId;
    subjectId;
    teacherId;
    startsOn;
    endsOn;
    static _OPENAPI_METADATA_FACTORY() {
        return { academicYearId: { required: true, type: () => String, format: "uuid" }, termId: { required: false, type: () => String, format: "uuid" }, classroomId: { required: true, type: () => String, format: "uuid" }, subjectId: { required: true, type: () => String, format: "uuid" }, teacherId: { required: true, type: () => String, format: "uuid" }, startsOn: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, endsOn: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" } };
    }
}
exports.TeachingAssignmentDto = TeachingAssignmentDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TeachingAssignmentDto.prototype, "academicYearId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TeachingAssignmentDto.prototype, "termId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TeachingAssignmentDto.prototype, "classroomId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TeachingAssignmentDto.prototype, "subjectId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TeachingAssignmentDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TeachingAssignmentDto.prototype, "startsOn", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TeachingAssignmentDto.prototype, "endsOn", void 0);
class SubjectBookReferenceDto {
    subjectId;
    bookId;
    static _OPENAPI_METADATA_FACTORY() {
        return { subjectId: { required: true, type: () => String, format: "uuid" }, bookId: { required: true, type: () => String, minLength: 1, maxLength: 120 } };
    }
}
exports.SubjectBookReferenceDto = SubjectBookReferenceDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubjectBookReferenceDto.prototype, "subjectId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], SubjectBookReferenceDto.prototype, "bookId", void 0);
class EndTeachingAssignmentDto {
    endsOn;
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { endsOn: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, reason: { required: true, type: () => String, minLength: 2, maxLength: 1000 } };
    }
}
exports.EndTeachingAssignmentDto = EndTeachingAssignmentDto;
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], EndTeachingAssignmentDto.prototype, "endsOn", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], EndTeachingAssignmentDto.prototype, "reason", void 0);
class AcademicSubjectDto {
    code;
    name;
    category;
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => String, minLength: 1, maxLength: 80, pattern: "^[A-Za-z0-9_-]+$" }, name: { required: true, type: () => String, minLength: 1, maxLength: 160 }, category: { required: false, type: () => String, minLength: 1, maxLength: 80 } };
    }
}
exports.AcademicSubjectDto = AcademicSubjectDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    (0, class_validator_1.Matches)(/^[A-Za-z0-9_-]+$/),
    __metadata("design:type", String)
], AcademicSubjectDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], AcademicSubjectDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], AcademicSubjectDto.prototype, "category", void 0);
//# sourceMappingURL=academic.dto.js.map