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
exports.AddClassBookDto = exports.ClassTransferDto = exports.ClassTransferRowDto = exports.SetClassEnrollmentsDto = exports.SetClassBooksDto = exports.UpdateEducationClassDto = exports.SaveEducationClassDto = exports.SCHOOL_YEAR_PATTERN = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
exports.SCHOOL_YEAR_PATTERN = /^(140[5-9]|14[1-2][0-9]|1430)-(140[6-9]|14[1-3][0-9]|1431)$/;
class SaveEducationClassDto {
    organizationId;
    code;
    name;
    schoolYear;
    capacity;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, code: { required: true, type: () => String, minLength: 2, maxLength: 80 }, name: { required: true, type: () => String, minLength: 2, maxLength: 160 }, schoolYear: { required: true, type: () => String }, capacity: { required: false, type: () => Number, minimum: 1, maximum: 200 } };
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
    (0, class_validator_1.Matches)(exports.SCHOOL_YEAR_PATTERN),
    __metadata("design:type", String)
], SaveEducationClassDto.prototype, "schoolYear", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], SaveEducationClassDto.prototype, "capacity", void 0);
class UpdateEducationClassDto {
    code;
    name;
    schoolYear;
    capacity;
    description;
    advisorId;
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: false, type: () => String, minLength: 2, maxLength: 80 }, name: { required: false, type: () => String, minLength: 2, maxLength: 160 }, schoolYear: { required: false, type: () => String }, capacity: { required: false, type: () => Number, minimum: 1, maximum: 200 }, description: { required: false, type: () => String, maxLength: 4000 }, advisorId: { required: false, type: () => String, nullable: true, format: "uuid" }, status: { required: false, enum: ["ARCHIVED", "ACTIVE"], enum: ["ACTIVE", "ARCHIVED"] } };
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
    (0, class_validator_1.Matches)(exports.SCHOOL_YEAR_PATTERN),
    __metadata("design:type", String)
], UpdateEducationClassDto.prototype, "schoolYear", void 0);
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
class ClassTransferRowDto {
    code;
    name;
    schoolYear;
    capacity;
    static _OPENAPI_METADATA_FACTORY() {
        return { code: { required: true, type: () => String, minLength: 2, maxLength: 80 }, name: { required: true, type: () => String, minLength: 2, maxLength: 160 }, schoolYear: { required: true, type: () => String }, capacity: { required: false, type: () => Number, minimum: 1, maximum: 200 } };
    }
}
exports.ClassTransferRowDto = ClassTransferRowDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], ClassTransferRowDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], ClassTransferRowDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(exports.SCHOOL_YEAR_PATTERN),
    __metadata("design:type", String)
], ClassTransferRowDto.prototype, "schoolYear", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Number)
], ClassTransferRowDto.prototype, "capacity", void 0);
class ClassTransferDto {
    organizationId;
    rows;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, rows: { required: true, type: () => [require("./classes.dto").ClassTransferRowDto], maxItems: 500 } };
    }
}
exports.ClassTransferDto = ClassTransferDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ClassTransferDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(500),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ClassTransferRowDto),
    __metadata("design:type", Array)
], ClassTransferDto.prototype, "rows", void 0);
class AddClassBookDto {
    bookId;
    teacherId;
    static _OPENAPI_METADATA_FACTORY() {
        return { bookId: { required: true, type: () => String, minLength: 1, maxLength: 120 }, teacherId: { required: true, type: () => String, format: "uuid" } };
    }
}
exports.AddClassBookDto = AddClassBookDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], AddClassBookDto.prototype, "bookId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddClassBookDto.prototype, "teacherId", void 0);
//# sourceMappingURL=classes.dto.js.map