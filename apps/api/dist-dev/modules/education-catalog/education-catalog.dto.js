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
exports.ImportEducationBooksDto = exports.UpdateEducationBookDto = exports.SaveEducationBookDto = exports.CLASS_MANAGED_BOOK_GRADE = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const states = ["DRAFT", "PUBLISHED", "ARCHIVED"];
exports.CLASS_MANAGED_BOOK_GRADE = 0;
class SaveEducationBookDto {
    id;
    country;
    schoolYear;
    grade;
    level;
    branch;
    track;
    category;
    titleFa;
    titleEn;
    textbookCode;
    appliesTo;
    notes;
    state;
    organizationId;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String, maxLength: 120 }, country: { required: true, type: () => String, maxLength: 12 }, schoolYear: { required: true, type: () => String, maxLength: 16 }, grade: { required: true, type: () => Number, minimum: exports.CLASS_MANAGED_BOOK_GRADE }, level: { required: true, type: () => String, maxLength: 80 }, branch: { required: true, type: () => String, maxLength: 120 }, track: { required: true, type: () => String, maxLength: 160 }, category: { required: true, type: () => String, maxLength: 160 }, titleFa: { required: true, type: () => String, maxLength: 240 }, titleEn: { required: false, type: () => String, maxLength: 240 }, textbookCode: { required: false, type: () => String, maxLength: 80 }, appliesTo: { required: true, type: () => [String] }, notes: { required: false, type: () => String }, state: { required: false, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], enum: states }, organizationId: { required: false, type: () => String, nullable: true, format: "uuid" } };
    }
}
exports.SaveEducationBookDto = SaveEducationBookDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(12),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(16),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "schoolYear", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(exports.CLASS_MANAGED_BOOK_GRADE),
    __metadata("design:type", Number)
], SaveEducationBookDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "branch", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "track", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "titleFa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "titleEn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "textbookCode", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SaveEducationBookDto.prototype, "appliesTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveEducationBookDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(states),
    __metadata("design:type", Object)
], SaveEducationBookDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], SaveEducationBookDto.prototype, "organizationId", void 0);
class UpdateEducationBookDto {
    country;
    schoolYear;
    grade;
    level;
    branch;
    track;
    category;
    titleFa;
    titleEn;
    textbookCode;
    appliesTo;
    notes;
    state;
    organizationId;
    static _OPENAPI_METADATA_FACTORY() {
        return { country: { required: false, type: () => String, maxLength: 12 }, schoolYear: { required: false, type: () => String, maxLength: 16 }, grade: { required: false, type: () => Number, minimum: exports.CLASS_MANAGED_BOOK_GRADE }, level: { required: false, type: () => String, maxLength: 80 }, branch: { required: false, type: () => String, maxLength: 120 }, track: { required: false, type: () => String, maxLength: 160 }, category: { required: false, type: () => String, maxLength: 160 }, titleFa: { required: false, type: () => String, maxLength: 240 }, titleEn: { required: false, type: () => String, maxLength: 240 }, textbookCode: { required: false, type: () => String, maxLength: 80 }, appliesTo: { required: false, type: () => [String] }, notes: { required: false, type: () => String }, state: { required: false, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], enum: states }, organizationId: { required: false, type: () => String, nullable: true, format: "uuid" } };
    }
}
exports.UpdateEducationBookDto = UpdateEducationBookDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(12),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(16),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "schoolYear", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(exports.CLASS_MANAGED_BOOK_GRADE),
    __metadata("design:type", Number)
], UpdateEducationBookDto.prototype, "grade", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "level", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "branch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "track", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "titleFa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "titleEn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "textbookCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateEducationBookDto.prototype, "appliesTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateEducationBookDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(states),
    __metadata("design:type", Object)
], UpdateEducationBookDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateEducationBookDto.prototype, "organizationId", void 0);
class ImportEducationBooksDto {
    books;
    static _OPENAPI_METADATA_FACTORY() {
        return { books: { required: true, type: () => [require("./education-catalog.dto").SaveEducationBookDto] } };
    }
}
exports.ImportEducationBooksDto = ImportEducationBooksDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ImportEducationBooksDto.prototype, "books", void 0);
//# sourceMappingURL=education-catalog.dto.js.map