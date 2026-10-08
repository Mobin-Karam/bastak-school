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
exports.Exam = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const question_entity_1 = require("./question.entity");
const exam_attempt_entity_1 = require("./exam-attempt.entity");
const exam_assignment_entity_1 = require("./exam-assignment.entity");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
const exam_syllabus_entity_1 = require("./exam-syllabus.entity");
let Exam = class Exam {
    id;
    title;
    description;
    subject;
    externalRef;
    duration;
    attemptLimit;
    published;
    audienceRules;
    mode;
    lifecycleStatus;
    navigationMode;
    timerMode;
    allowResume;
    allowLateStart;
    allowPracticeAfterDeadline;
    autoSubmitOnTimeout;
    sessionPolicy;
    integrityMonitoring;
    instructions;
    allowBackNavigation;
    scoring;
    resultPolicy;
    resultReleaseAt;
    answerKeyReleaseAt;
    explanationReleaseAt;
    rankingReleaseAt;
    latestStartAt;
    resultsReleased;
    sections;
    startTime;
    endTime;
    organization;
    createdBy;
    createdAt;
    updatedAt;
    deletedAt;
    questions;
    attempts;
    assignments;
    syllabus;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, title: { required: true, type: () => String }, description: { required: true, type: () => String }, subject: { required: true, type: () => String }, externalRef: { required: true, type: () => String }, duration: { required: true, type: () => Number }, attemptLimit: { required: true, type: () => Number }, published: { required: true, type: () => Boolean }, audienceRules: { required: true, type: () => ({ gradeIds: { required: true, type: () => [Number] }, educationTypeIds: { required: true, type: () => [String] }, trackIds: { required: true, type: () => [String] }, learnerProfiles: { required: true, type: () => [String] }, independentTypes: { required: true, type: () => [String] } }), description: "Server-resolved cohort targeting; direct assignments remain supported." }, mode: { required: true, enum: ["standard", "konkur", "mock", "practice", "quiz", "diagnostic"] }, lifecycleStatus: { required: true, enum: ["scheduled", "draft", "cancelled"] }, navigationMode: { required: true, enum: ["free", "section_only", "sequential"] }, timerMode: { required: true, enum: ["whole_exam", "per_section"] }, allowResume: { required: true, type: () => Boolean }, allowLateStart: { required: true, type: () => Boolean }, allowPracticeAfterDeadline: { required: true, type: () => Boolean }, autoSubmitOnTimeout: { required: true, type: () => Boolean }, sessionPolicy: { required: true, enum: ["allow_resume", "single_session"] }, integrityMonitoring: { required: true, type: () => Boolean }, instructions: { required: true, type: () => [String] }, allowBackNavigation: { required: true, type: () => Boolean }, scoring: { required: true, type: () => ({ correct: { required: true, type: () => Number }, wrong: { required: true, type: () => Number }, unanswered: { required: true, type: () => Number }, negativeMarking: { required: true, type: () => Boolean } }) }, resultPolicy: { required: true, enum: ["scheduled", "immediate", "manual"] }, resultReleaseAt: { required: false, type: () => Date, nullable: true }, answerKeyReleaseAt: { required: false, type: () => Date, nullable: true }, explanationReleaseAt: { required: false, type: () => Date, nullable: true }, rankingReleaseAt: { required: false, type: () => Date, nullable: true }, latestStartAt: { required: false, type: () => Date, nullable: true }, resultsReleased: { required: true, type: () => Boolean }, sections: { required: true }, startTime: { required: false, type: () => Date, nullable: true }, endTime: { required: false, type: () => Date, nullable: true }, organization: { required: false, type: () => require("./organization.entity").Organization, nullable: true }, createdBy: { required: false, type: () => require("./user.entity").User, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, deletedAt: { required: false, type: () => Date, nullable: true }, questions: { required: true, type: () => [require("./question.entity").Question] }, attempts: { required: true, type: () => [require("./exam-attempt.entity").ExamAttempt] }, assignments: { required: true, type: () => [require("./exam-assignment.entity").ExamAssignment] }, syllabus: { required: true, type: () => [require("./exam-syllabus.entity").ExamSyllabus] } };
    }
};
exports.Exam = Exam;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Exam.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 220 }),
    __metadata("design:type", String)
], Exam.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Exam.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Exam.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Exam.prototype, "externalRef", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Exam.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], Exam.prototype, "attemptLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Exam.prototype, "published", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "simple-json",
        default: '{"gradeIds":[],"educationTypeIds":[],"trackIds":[],"learnerProfiles":[],"independentTypes":[]}',
    }),
    __metadata("design:type", Object)
], Exam.prototype, "audienceRules", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "standard" }),
    __metadata("design:type", String)
], Exam.prototype, "mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "scheduled" }),
    __metadata("design:type", String)
], Exam.prototype, "lifecycleStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "free" }),
    __metadata("design:type", String)
], Exam.prototype, "navigationMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "whole_exam" }),
    __metadata("design:type", String)
], Exam.prototype, "timerMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Exam.prototype, "allowResume", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Exam.prototype, "allowLateStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Exam.prototype, "allowPracticeAfterDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Exam.prototype, "autoSubmitOnTimeout", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "allow_resume" }),
    __metadata("design:type", String)
], Exam.prototype, "sessionPolicy", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Exam.prototype, "integrityMonitoring", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], Exam.prototype, "instructions", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Exam.prototype, "allowBackNavigation", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "simple-json",
        default: '{"correct":1,"wrong":0,"unanswered":0,"negativeMarking":false}',
    }),
    __metadata("design:type", Object)
], Exam.prototype, "scoring", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "immediate" }),
    __metadata("design:type", String)
], Exam.prototype, "resultPolicy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Exam.prototype, "resultReleaseAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Exam.prototype, "answerKeyReleaseAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Exam.prototype, "explanationReleaseAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Exam.prototype, "rankingReleaseAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Exam.prototype, "latestStartAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Exam.prototype, "resultsReleased", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], Exam.prototype, "sections", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Exam.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Exam.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], Exam.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], Exam.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Exam.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Exam.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Exam.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => question_entity_1.Question, (question) => question.exam, { cascade: true }),
    __metadata("design:type", Array)
], Exam.prototype, "questions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => exam_attempt_entity_1.ExamAttempt, (attempt) => attempt.exam),
    __metadata("design:type", Array)
], Exam.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => exam_assignment_entity_1.ExamAssignment, (assignment) => assignment.exam),
    __metadata("design:type", Array)
], Exam.prototype, "assignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => exam_syllabus_entity_1.ExamSyllabus, (syllabus) => syllabus.exam),
    __metadata("design:type", Array)
], Exam.prototype, "syllabus", void 0);
exports.Exam = Exam = __decorate([
    (0, typeorm_1.Entity)("exams")
], Exam);
//# sourceMappingURL=exam.entity.js.map