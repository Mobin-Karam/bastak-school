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
exports.Student = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const plan_entity_1 = require("./plan.entity");
const exam_attempt_entity_1 = require("./exam-attempt.entity");
const daily_report_entity_1 = require("./daily-report.entity");
const recovery_request_entity_1 = require("./recovery-request.entity");
const learning_item_entity_1 = require("./learning-item.entity");
const organization_entity_1 = require("./organization.entity");
let Student = class Student {
    id;
    user;
    organization;
    name;
    nationalCode;
    gradeId;
    learnerProfile;
    independentType;
    learningLevel;
    educationTypeId;
    trackId;
    grade;
    major;
    targetUniversity;
    targetField;
    targetRank;
    dailyCapacity;
    accountStatus;
    onboardingStatus;
    registrationStatus;
    guardianChatReadOnly;
    guardianChangedAt;
    createdAt;
    updatedAt;
    plans;
    examAttempts;
    dailyReports;
    recoveryRequests;
    learningItems;
    profile;
    enrollments;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, user: { required: false, type: () => require("./user.entity").User, nullable: true }, organization: { required: false, type: () => require("./organization.entity").Organization, nullable: true, description: "Primary school/organization owning this student record." }, name: { required: true, type: () => String }, nationalCode: { required: false, type: () => String, nullable: true }, gradeId: { required: false, type: () => Number, nullable: true }, learnerProfile: { required: true, enum: ["school", "independent"] }, independentType: { required: false, nullable: true, enum: ["adult", "gap_year", "homeschool", "other"] }, learningLevel: { required: true, type: () => String }, educationTypeId: { required: true, type: () => String }, trackId: { required: true, type: () => String }, grade: { required: true, type: () => String }, major: { required: true, type: () => String }, targetUniversity: { required: true, type: () => String }, targetField: { required: true, type: () => String }, targetRank: { required: true, type: () => String }, dailyCapacity: { required: true, type: () => String }, accountStatus: { required: true, enum: ["active", "archived", "inactive"] }, onboardingStatus: { required: true, enum: ["ASSIGNED", "PENDING_ASSIGNMENT"] }, registrationStatus: { required: true, enum: ["ACTIVE", "ACCOUNT_CREATED", "IN_PROGRESS", "WAITING_REVIEW", "NEEDS_CORRECTION", "APPROVED", "REJECTED"] }, guardianChatReadOnly: { required: true, type: () => Boolean }, guardianChangedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, plans: { required: true, type: () => [require("./plan.entity").Plan] }, examAttempts: { required: true, type: () => [require("./exam-attempt.entity").ExamAttempt] }, dailyReports: { required: true, type: () => [require("./daily-report.entity").DailyReport] }, recoveryRequests: { required: true, type: () => [require("./recovery-request.entity").RecoveryRequest] }, learningItems: { required: true, type: () => [require("./learning-item.entity").LearningItem] }, profile: { required: false, type: () => require("./student-profile.entity").StudentProfile, nullable: true }, enrollments: { required: false, type: () => [require("./education-class-enrollment.entity").EducationClassEnrollment] } };
    }
};
exports.Student = Student;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Student.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.student, {
        nullable: true,
        onDelete: "SET NULL",
    }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Object)
], Student.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], Student.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], Student.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], Student.prototype, "nationalCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", nullable: true }),
    __metadata("design:type", Object)
], Student.prototype, "gradeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 24, default: "school" }),
    __metadata("design:type", String)
], Student.prototype, "learnerProfile", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", Object)
], Student.prototype, "independentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: "" }),
    __metadata("design:type", String)
], Student.prototype, "learningLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 40, default: "general" }),
    __metadata("design:type", String)
], Student.prototype, "educationTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80, default: "general" }),
    __metadata("design:type", String)
], Student.prototype, "trackId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Student.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Student.prototype, "major", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Student.prototype, "targetUniversity", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Student.prototype, "targetField", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Student.prototype, "targetRank", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Student.prototype, "dailyCapacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "active" }),
    __metadata("design:type", String)
], Student.prototype, "accountStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32, default: "ASSIGNED" }),
    __metadata("design:type", String)
], Student.prototype, "onboardingStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32, default: "ACCOUNT_CREATED" }),
    __metadata("design:type", String)
], Student.prototype, "registrationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Student.prototype, "guardianChatReadOnly", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Student.prototype, "guardianChangedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Student.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Student.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => plan_entity_1.Plan, (plan) => plan.student),
    __metadata("design:type", Array)
], Student.prototype, "plans", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => exam_attempt_entity_1.ExamAttempt, (attempt) => attempt.student),
    __metadata("design:type", Array)
], Student.prototype, "examAttempts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => daily_report_entity_1.DailyReport, (report) => report.student),
    __metadata("design:type", Array)
], Student.prototype, "dailyReports", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => recovery_request_entity_1.RecoveryRequest, (request) => request.student),
    __metadata("design:type", Array)
], Student.prototype, "recoveryRequests", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => learning_item_entity_1.LearningItem, (item) => item.student),
    __metadata("design:type", Array)
], Student.prototype, "learningItems", void 0);
__decorate([
    (0, typeorm_1.OneToOne)("StudentProfile", (profile) => profile.student),
    __metadata("design:type", Object)
], Student.prototype, "profile", void 0);
__decorate([
    (0, typeorm_1.OneToMany)("EducationClassEnrollment", (enrollment) => enrollment.student),
    __metadata("design:type", Array)
], Student.prototype, "enrollments", void 0);
exports.Student = Student = __decorate([
    (0, typeorm_1.Entity)("students")
], Student);
//# sourceMappingURL=student.entity.js.map