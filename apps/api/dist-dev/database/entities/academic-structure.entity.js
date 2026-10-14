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
exports.ClassEnrollmentHistory = exports.SubjectBookReference = exports.TeachingAssignment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let TeachingAssignment = class TeachingAssignment {
    id;
    organizationId;
    organization;
    academicYearId;
    year;
    termId;
    term;
    classroomId;
    classroom;
    subjectId;
    subject;
    teacherId;
    teacher;
    startsOn;
    endsOn;
    status;
    createdById;
    createdBy;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organizationId: { required: true, type: () => String }, organization: { required: false, type: () => Object }, academicYearId: { required: true, type: () => String }, year: { required: false, type: () => Object }, termId: { required: true, type: () => String, nullable: true }, term: { required: false, type: () => Object }, classroomId: { required: true, type: () => String }, classroom: { required: false, type: () => Object }, subjectId: { required: true, type: () => String }, subject: { required: false, type: () => Object }, teacherId: { required: true, type: () => String }, teacher: { required: false, type: () => Object }, startsOn: { required: true, type: () => String }, endsOn: { required: true, type: () => String }, status: { required: true, enum: ["ACTIVE", "ENDED"] }, createdById: { required: true, type: () => String }, createdBy: { required: false, type: () => Object }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TeachingAssignment = TeachingAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Organization", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "organizationId" }),
    __metadata("design:type", Object)
], TeachingAssignment.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "academicYearId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableAcademicYear", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "academicYearId" }),
    __metadata("design:type", Object)
], TeachingAssignment.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], TeachingAssignment.prototype, "termId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("TimetableTerm", { nullable: true, onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "termId" }),
    __metadata("design:type", Object)
], TeachingAssignment.prototype, "term", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "classroomId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("EducationClass", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "classroomId" }),
    __metadata("design:type", Object)
], TeachingAssignment.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Subject", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "subjectId" }),
    __metadata("design:type", Object)
], TeachingAssignment.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "teacherId" }),
    __metadata("design:type", Object)
], TeachingAssignment.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "startsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10 }),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "endsOn", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "ACTIVE" }),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], TeachingAssignment.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "createdById" }),
    __metadata("design:type", Object)
], TeachingAssignment.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TeachingAssignment.prototype, "createdAt", void 0);
exports.TeachingAssignment = TeachingAssignment = __decorate([
    (0, typeorm_1.Entity)("teaching_assignments"),
    (0, typeorm_1.Index)(["organizationId", "teacherId", "startsOn", "endsOn"])
], TeachingAssignment);
let SubjectBookReference = class SubjectBookReference {
    id;
    organizationId;
    organization;
    subjectId;
    subject;
    bookId;
    book;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organizationId: { required: true, type: () => String }, organization: { required: false, type: () => Object }, subjectId: { required: true, type: () => String }, subject: { required: false, type: () => Object }, bookId: { required: true, type: () => String }, book: { required: false, type: () => Object }, createdAt: { required: true, type: () => Date } };
    }
};
exports.SubjectBookReference = SubjectBookReference;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SubjectBookReference.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], SubjectBookReference.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Organization", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "organizationId" }),
    __metadata("design:type", Object)
], SubjectBookReference.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], SubjectBookReference.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Subject", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "subjectId" }),
    __metadata("design:type", Object)
], SubjectBookReference.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 120 }),
    __metadata("design:type", String)
], SubjectBookReference.prototype, "bookId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("EducationBook", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "bookId" }),
    __metadata("design:type", Object)
], SubjectBookReference.prototype, "book", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SubjectBookReference.prototype, "createdAt", void 0);
exports.SubjectBookReference = SubjectBookReference = __decorate([
    (0, typeorm_1.Entity)("subject_book_references"),
    (0, typeorm_1.Index)(["organizationId", "subjectId", "bookId"], { unique: true })
], SubjectBookReference);
let ClassEnrollmentHistory = class ClassEnrollmentHistory {
    id;
    organizationId;
    organization;
    classroomId;
    classroom;
    actorId;
    actor;
    beforeStudentIds;
    afterStudentIds;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organizationId: { required: true, type: () => String }, organization: { required: false, type: () => Object }, classroomId: { required: true, type: () => String }, classroom: { required: false, type: () => Object }, actorId: { required: true, type: () => String }, actor: { required: false, type: () => Object }, beforeStudentIds: { required: true, type: () => [String] }, afterStudentIds: { required: true, type: () => [String] }, createdAt: { required: true, type: () => Date } };
    }
};
exports.ClassEnrollmentHistory = ClassEnrollmentHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ClassEnrollmentHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], ClassEnrollmentHistory.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("Organization", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "organizationId" }),
    __metadata("design:type", Object)
], ClassEnrollmentHistory.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], ClassEnrollmentHistory.prototype, "classroomId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("EducationClass", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "classroomId" }),
    __metadata("design:type", Object)
], ClassEnrollmentHistory.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36 }),
    __metadata("design:type", String)
], ClassEnrollmentHistory.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("User", { onDelete: "RESTRICT" }),
    (0, typeorm_1.JoinColumn)({ name: "actorId" }),
    __metadata("design:type", Object)
], ClassEnrollmentHistory.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Array)
], ClassEnrollmentHistory.prototype, "beforeStudentIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Array)
], ClassEnrollmentHistory.prototype, "afterStudentIds", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ClassEnrollmentHistory.prototype, "createdAt", void 0);
exports.ClassEnrollmentHistory = ClassEnrollmentHistory = __decorate([
    (0, typeorm_1.Entity)("class_enrollment_history"),
    (0, typeorm_1.Index)(["organizationId", "classroomId", "createdAt", "id"])
], ClassEnrollmentHistory);
//# sourceMappingURL=academic-structure.entity.js.map