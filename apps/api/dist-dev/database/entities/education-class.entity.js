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
exports.EducationClass = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
const education_class_book_entity_1 = require("./education-class-book.entity");
const education_class_enrollment_entity_1 = require("./education-class-enrollment.entity");
let EducationClass = class EducationClass {
    id;
    organization;
    code;
    name;
    schoolYear;
    gradeId;
    educationTypeId;
    trackId;
    capacity;
    status;
    description;
    advisor;
    books;
    enrollments;
    timetableSectionId;
    timetableSection;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, code: { required: true, type: () => String }, name: { required: true, type: () => String }, schoolYear: { required: true, type: () => String }, gradeId: { required: true, type: () => Number }, educationTypeId: { required: true, type: () => String }, trackId: { required: true, type: () => String }, capacity: { required: true, type: () => Number }, status: { required: true, enum: ["ARCHIVED", "ACTIVE"] }, description: { required: true, type: () => String }, advisor: { required: false, type: () => require("./user.entity").User, nullable: true }, books: { required: true, type: () => [require("./education-class-book.entity").EducationClassBook] }, enrollments: { required: true, type: () => [require("./education-class-enrollment.entity").EducationClassEnrollment] }, timetableSectionId: { required: true, type: () => String, nullable: true }, timetableSection: { required: false, type: () => Object }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.EducationClass = EducationClass;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EducationClass.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], EducationClass.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80 }),
    __metadata("design:type", String)
], EducationClass.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], EducationClass.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 16 }),
    __metadata("design:type", String)
], EducationClass.prototype, "schoolYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer" }),
    __metadata("design:type", Number)
], EducationClass.prototype, "gradeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 40 }),
    __metadata("design:type", String)
], EducationClass.prototype, "educationTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80 }),
    __metadata("design:type", String)
], EducationClass.prototype, "trackId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 35 }),
    __metadata("design:type", Number)
], EducationClass.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: "ACTIVE" }),
    __metadata("design:type", String)
], EducationClass.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], EducationClass.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], EducationClass.prototype, "advisor", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => education_class_book_entity_1.EducationClassBook, (book) => book.classroom),
    __metadata("design:type", Array)
], EducationClass.prototype, "books", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => education_class_enrollment_entity_1.EducationClassEnrollment, (enrollment) => enrollment.classroom),
    __metadata("design:type", Array)
], EducationClass.prototype, "enrollments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], EducationClass.prototype, "timetableSectionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableSection", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "timetableSectionId" }),
    __metadata("design:type", Object)
], EducationClass.prototype, "timetableSection", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EducationClass.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EducationClass.prototype, "updatedAt", void 0);
exports.EducationClass = EducationClass = __decorate([
    (0, typeorm_1.Entity)("education_classes"),
    (0, typeorm_1.Index)(["organization", "code"], { unique: true })
], EducationClass);
//# sourceMappingURL=education-class.entity.js.map