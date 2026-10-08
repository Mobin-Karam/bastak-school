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
exports.ResetStudentPasswordDto = exports.UpdateStudentDto = exports.CreateStudentDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateStudentDto {
    name;
    phoneNumber;
    password;
    organizationId;
    learnerProfile;
    independentType;
    learningLevel;
    gradeId;
    educationTypeId;
    trackId;
    grade;
    major;
    targetUniversity;
    targetField;
    targetRank;
    dailyCapacity;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2, maxLength: 160 }, phoneNumber: { required: true, type: () => String, minLength: 11, maxLength: 11 }, password: { required: true, type: () => String, minLength: 12 }, organizationId: { required: false, type: () => String, format: "uuid" }, learnerProfile: { required: false, enum: ["school", "independent"], enum: ["school", "independent"] }, independentType: { required: false, enum: ["adult", "gap_year", "homeschool", "other"], enum: ["adult", "gap_year", "homeschool", "other"] }, learningLevel: { required: false, type: () => String, minLength: 0, maxLength: 120 }, gradeId: { required: false, type: () => Number, minimum: 1, maximum: 12 }, educationTypeId: { required: false, type: () => String, minLength: 1, maxLength: 40 }, trackId: { required: false, type: () => String, minLength: 1, maxLength: 80 }, grade: { required: false, type: () => String, minLength: 0, maxLength: 80 }, major: { required: false, type: () => String, minLength: 0, maxLength: 80 }, targetUniversity: { required: false, type: () => String, minLength: 0, maxLength: 160 }, targetField: { required: false, type: () => String, minLength: 0, maxLength: 160 }, targetRank: { required: false, type: () => String, minLength: 0, maxLength: 40 }, dailyCapacity: { required: false, type: () => String, minLength: 0, maxLength: 40 } };
    }
}
exports.CreateStudentDto = CreateStudentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(11, 11),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(12),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["school", "independent"]),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "learnerProfile", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["adult", "gap_year", "homeschool", "other"]),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "independentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 120),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "learningLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], CreateStudentDto.prototype, "gradeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 40),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "educationTypeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 80),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "trackId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 80),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 80),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "major", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 160),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "targetUniversity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 160),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "targetField", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 40),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "targetRank", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 40),
    __metadata("design:type", String)
], CreateStudentDto.prototype, "dailyCapacity", void 0);
class UpdateStudentDto {
    learnerProfile;
    independentType;
    learningLevel;
    name;
    phoneNumber;
    gradeId;
    educationTypeId;
    trackId;
    grade;
    major;
    targetUniversity;
    targetField;
    targetRank;
    dailyCapacity;
    static _OPENAPI_METADATA_FACTORY() {
        return { learnerProfile: { required: false, enum: ["school", "independent"], enum: ["school", "independent"] }, independentType: { required: false, enum: ["adult", "gap_year", "homeschool", "other"], enum: ["adult", "gap_year", "homeschool", "other"] }, learningLevel: { required: false, type: () => String, minLength: 0, maxLength: 120 }, name: { required: false, type: () => String, minLength: 2, maxLength: 160 }, phoneNumber: { required: false, type: () => String, minLength: 11, maxLength: 11 }, gradeId: { required: false, type: () => Number, minimum: 1, maximum: 12 }, educationTypeId: { required: false, type: () => String, minLength: 1, maxLength: 40 }, trackId: { required: false, type: () => String, minLength: 1, maxLength: 80 }, grade: { required: false, type: () => String, minLength: 0, maxLength: 80 }, major: { required: false, type: () => String, minLength: 0, maxLength: 80 }, targetUniversity: { required: false, type: () => String, minLength: 0, maxLength: 160 }, targetField: { required: false, type: () => String, minLength: 0, maxLength: 160 }, targetRank: { required: false, type: () => String, minLength: 0, maxLength: 40 }, dailyCapacity: { required: false, type: () => String, minLength: 0, maxLength: 40 } };
    }
}
exports.UpdateStudentDto = UpdateStudentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["school", "independent"]),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "learnerProfile", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["adult", "gap_year", "homeschool", "other"]),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "independentType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 120),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "learningLevel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 160),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(11, 11),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], UpdateStudentDto.prototype, "gradeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 40),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "educationTypeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 80),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "trackId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 80),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 80),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "major", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 160),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "targetUniversity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 160),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "targetField", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 40),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "targetRank", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 40),
    __metadata("design:type", String)
], UpdateStudentDto.prototype, "dailyCapacity", void 0);
class ResetStudentPasswordDto {
    password;
    static _OPENAPI_METADATA_FACTORY() {
        return { password: { required: true, type: () => String, minLength: 12 } };
    }
}
exports.ResetStudentPasswordDto = ResetStudentPasswordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(12),
    __metadata("design:type", String)
], ResetStudentPasswordDto.prototype, "password", void 0);
//# sourceMappingURL=student-admin.dto.js.map