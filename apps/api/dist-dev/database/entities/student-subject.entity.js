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
exports.StudentSubject = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const subject_entity_1 = require("./subject.entity");
let StudentSubject = class StudentSubject {
    id;
    student;
    subject;
    enabled;
    displayName;
    weeklyTargetMinutes;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, subject: { required: true, type: () => require("./subject.entity").Subject }, enabled: { required: true, type: () => Boolean }, displayName: { required: true, type: () => String }, weeklyTargetMinutes: { required: true, type: () => Number }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.StudentSubject = StudentSubject;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudentSubject.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], StudentSubject.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subject_entity_1.Subject, { nullable: false, onDelete: "RESTRICT" }),
    __metadata("design:type", subject_entity_1.Subject)
], StudentSubject.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], StudentSubject.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: "" }),
    __metadata("design:type", String)
], StudentSubject.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], StudentSubject.prototype, "weeklyTargetMinutes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentSubject.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentSubject.prototype, "updatedAt", void 0);
exports.StudentSubject = StudentSubject = __decorate([
    (0, typeorm_1.Entity)("student_subjects"),
    (0, typeorm_1.Index)(["student", "subject"], { unique: true })
], StudentSubject);
//# sourceMappingURL=student-subject.entity.js.map