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
exports.StudentProfile = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
let StudentProfile = class StudentProfile {
    id;
    student;
    birthCertificateNumber;
    birthDate;
    birthPlace;
    certificateIssuePlace;
    gender;
    previousSchool;
    address;
    postalCode;
    homePhone;
    emergencyPhone;
    healthNotes;
    insuranceProvider;
    insuranceNumber;
    transportNotes;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, birthCertificateNumber: { required: false, type: () => String, nullable: true }, birthDate: { required: false, type: () => Date, nullable: true }, birthPlace: { required: false, type: () => String, nullable: true }, certificateIssuePlace: { required: false, type: () => String, nullable: true }, gender: { required: false, type: () => String, nullable: true }, previousSchool: { required: false, type: () => String, nullable: true }, address: { required: false, type: () => String, nullable: true }, postalCode: { required: false, type: () => String, nullable: true }, homePhone: { required: false, type: () => String, nullable: true }, emergencyPhone: { required: false, type: () => String, nullable: true }, healthNotes: { required: false, type: () => String, nullable: true }, insuranceProvider: { required: false, type: () => String, nullable: true }, insuranceNumber: { required: false, type: () => String, nullable: true }, transportNotes: { required: false, type: () => String, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.StudentProfile = StudentProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudentProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", student_entity_1.Student)
], StudentProfile.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "birthCertificateNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "birthDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 120, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "birthPlace", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 120, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "certificateIssuePlace", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "previousSchool", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "postalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "homePhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "emergencyPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "healthNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 160, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "insuranceProvider", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 160, nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "insuranceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], StudentProfile.prototype, "transportNotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentProfile.prototype, "updatedAt", void 0);
exports.StudentProfile = StudentProfile = __decorate([
    (0, typeorm_1.Entity)("student_profiles")
], StudentProfile);
//# sourceMappingURL=student-profile.entity.js.map