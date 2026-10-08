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
exports.SetClassEnrollmentsDto = exports.SetClassBooksDto = exports.UpdateEducationClassDto = exports.SaveEducationClassDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SaveEducationClassDto {
    organizationId;
    code;
    name;
    schoolYear;
    gradeId;
    educationTypeId;
    trackId;
    capacity;
    description;
    advisorId;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, code: { required: true, type: () => String, minLength: 2, maxLength: 80 }, name: { required: true, type: () => String, minLength: 2, maxLength: 160 }, schoolYear: { required: true, type: () => String, minLength: 4, maxLength: 16 }, gradeId: { required: true, type: () => Number, minimum: 1, maximum: 12 }, educationTypeId: { required: true, type: () => String, minLength: 2, maxLength: 40 }, trackId: { required: true, type: () => String, minLength: 2, maxLength: 80 }, capacity: { required: false, type: () => Number, minimum: 1, maximum: 200 }, description: { required: false, type: () => String, maxLength: 4000 }, advisorId: { required: false, type: () => String, nullable: true, format: "uuid" } };
    }
}
exports.SaveEducationClassDto = SaveEducationClassDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SaveEducationClassDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SaveEducationClassDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], SaveEducationClassDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(16),
    __metadata("design:type", String)
], SaveEducationClassDto.prototype, "schoolYear", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], SaveEducationClassDto.prototype, "gradeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], SaveEducationClassDto.prototype, "educationTypeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SaveEducationClassDto.prototype, "trackId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], SaveEducationClassDto.prototype, "capacity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], SaveEducationClassDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], SaveEducationClassDto.prototype, "advisorId", void 0);
class UpdateEducationClassDto {
    code;
    name;
    schoolYear;
    gradeId;
    educationTypeId;
    trackId;
    capacity;
    description;
    advisorId;
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: false, type: () => String, minLength: 2, maxLength: 80 }, name: { required: false, type: () => String, minLength: 2, maxLength: 160 }, schoolYear: { required: false, type: () => String, minLength: 4, maxLength: 16 }, gradeId: { required: false, type: () => Number, minimum: 1, maximum: 12 }, educationTypeId: { required: false, type: () => String, minLength: 2, maxLength: 40 }, trackId: { required: false, type: () => String, minLength: 2, maxLength: 80 }, capacity: { required: false, type: () => Number, minimum: 1, maximum: 200 }, description: { required: false, type: () => String, maxLength: 4000 }, advisorId: { required: false, type: () => String, nullable: true, format: "uuid" }, status: { required: false, enum: ["ARCHIVED", "ACTIVE"], enum: ["ACTIVE", "ARCHIVED"] } };
    }
}
exports.UpdateEducationClassDto = UpdateEducationClassDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateEducationClassDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdateEducationClassDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    (0, class_validator_1.MaxLength)(16),
    __metadata("design:type", String)
], UpdateEducationClassDto.prototype, "schoolYear", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], UpdateEducationClassDto.prototype, "gradeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], UpdateEducationClassDto.prototype, "educationTypeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateEducationClassDto.prototype, "trackId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], UpdateEducationClassDto.prototype, "capacity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], UpdateEducationClassDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateEducationClassDto.prototype, "advisorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["ACTIVE", "ARCHIVED"]),
    __metadata("design:type", String)
], UpdateEducationClassDto.prototype, "status", void 0);
class SetClassBooksDto {
    books;
    static _OPENAPI_METADATA_FACTORY() {
        return { books: { required: true, uniqueItems: true, maxItems: 80 } };
    }
}
exports.SetClassBooksDto = SetClassBooksDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)((item) => item.bookId),
    (0, class_validator_1.ArrayMaxSize)(80),
    __metadata("design:type", Array)
], SetClassBooksDto.prototype, "books", void 0);
class SetClassEnrollmentsDto {
    studentIds;
    static _OPENAPI_METADATA_FACTORY() {
        return { studentIds: { required: true, type: () => [String], uniqueItems: true, format: "uuid", maxItems: 200 } };
    }
}
exports.SetClassEnrollmentsDto = SetClassEnrollmentsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.ArrayMaxSize)(200),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], SetClassEnrollmentsDto.prototype, "studentIds", void 0);
//# sourceMappingURL=classes.dto.js.map