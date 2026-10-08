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
exports.EducationBook = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let EducationBook = class EducationBook {
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
    organizationId;
    state;
    version;
    publishedAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, country: { required: true, type: () => String }, schoolYear: { required: true, type: () => String }, grade: { required: true, type: () => Number }, level: { required: true, type: () => String }, branch: { required: true, type: () => String }, track: { required: true, type: () => String }, category: { required: true, type: () => String }, titleFa: { required: true, type: () => String }, titleEn: { required: true, type: () => String }, textbookCode: { required: false, type: () => String, nullable: true }, appliesTo: { required: true, type: () => [String] }, notes: { required: false, type: () => String, nullable: true }, organizationId: { required: false, type: () => String, nullable: true }, state: { required: true, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }, version: { required: true, type: () => Number }, publishedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.EducationBook = EducationBook;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 120 }),
    __metadata("design:type", String)
], EducationBook.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 12 }),
    __metadata("design:type", String)
], EducationBook.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 16 }),
    __metadata("design:type", String)
], EducationBook.prototype, "schoolYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer" }),
    __metadata("design:type", Number)
], EducationBook.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80 }),
    __metadata("design:type", String)
], EducationBook.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], EducationBook.prototype, "branch", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], EducationBook.prototype, "track", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], EducationBook.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 240 }),
    __metadata("design:type", String)
], EducationBook.prototype, "titleFa", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 240 }),
    __metadata("design:type", String)
], EducationBook.prototype, "titleEn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 80, nullable: true }),
    __metadata("design:type", Object)
], EducationBook.prototype, "textbookCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Array)
], EducationBook.prototype, "appliesTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], EducationBook.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], EducationBook.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 16, default: "PUBLISHED" }),
    __metadata("design:type", String)
], EducationBook.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 1 }),
    __metadata("design:type", Number)
], EducationBook.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], EducationBook.prototype, "publishedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EducationBook.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EducationBook.prototype, "updatedAt", void 0);
exports.EducationBook = EducationBook = __decorate([
    (0, typeorm_1.Entity)("education_books"),
    (0, typeorm_1.Index)(["schoolYear", "grade"])
], EducationBook);
//# sourceMappingURL=education-book.entity.js.map