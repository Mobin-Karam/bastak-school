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
exports.DailyReport = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
let DailyReport = class DailyReport {
    id;
    student;
    planDate;
    studyHours;
    tests;
    correct;
    wrong;
    blank;
    focus;
    fatigue;
    motivation;
    problem;
    tomorrow;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, planDate: { required: true, type: () => String }, studyHours: { required: true, type: () => Number }, tests: { required: true, type: () => Number }, correct: { required: true, type: () => Number }, wrong: { required: true, type: () => Number }, blank: { required: true, type: () => Number }, focus: { required: true, type: () => Number }, fatigue: { required: true, type: () => Number }, motivation: { required: true, type: () => Number }, problem: { required: true, type: () => String }, tomorrow: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.DailyReport = DailyReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DailyReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, (student) => student.dailyReports, {
        nullable: false,
        onDelete: "CASCADE",
    }),
    __metadata("design:type", student_entity_1.Student)
], DailyReport.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", String)
], DailyReport.prototype, "planDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "float", default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "studyHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "tests", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "correct", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "wrong", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "blank", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "focus", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "fatigue", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DailyReport.prototype, "motivation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 2000, default: "" }),
    __metadata("design:type", String)
], DailyReport.prototype, "problem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 2000, default: "" }),
    __metadata("design:type", String)
], DailyReport.prototype, "tomorrow", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DailyReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DailyReport.prototype, "updatedAt", void 0);
exports.DailyReport = DailyReport = __decorate([
    (0, typeorm_1.Entity)("daily_reports"),
    (0, typeorm_1.Index)(["student", "planDate"], { unique: true })
], DailyReport);
//# sourceMappingURL=daily-report.entity.js.map