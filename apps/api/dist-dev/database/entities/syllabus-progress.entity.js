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
exports.SyllabusProgress = exports.SyllabusProgressStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const exam_syllabus_entity_1 = require("./exam-syllabus.entity");
var SyllabusProgressStatus;
(function (SyllabusProgressStatus) {
    SyllabusProgressStatus["UNREAD"] = "unread";
    SyllabusProgressStatus["READ"] = "read";
    SyllabusProgressStatus["TESTED"] = "tested";
    SyllabusProgressStatus["REVIEW"] = "review";
    SyllabusProgressStatus["MASTERED"] = "mastered";
})(SyllabusProgressStatus || (exports.SyllabusProgressStatus = SyllabusProgressStatus = {}));
let SyllabusProgress = class SyllabusProgress {
    id;
    student;
    syllabus;
    status;
    accuracy;
    note;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, syllabus: { required: true, type: () => require("./exam-syllabus.entity").ExamSyllabus }, status: { required: true, enum: require("./syllabus-progress.entity").SyllabusProgressStatus }, accuracy: { required: true, type: () => Number }, note: { required: true, type: () => String }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.SyllabusProgress = SyllabusProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SyllabusProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], SyllabusProgress.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => exam_syllabus_entity_1.ExamSyllabus, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", exam_syllabus_entity_1.ExamSyllabus)
], SyllabusProgress.prototype, "syllabus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: SyllabusProgressStatus.UNREAD }),
    __metadata("design:type", String)
], SyllabusProgress.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], SyllabusProgress.prototype, "accuracy", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], SyllabusProgress.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SyllabusProgress.prototype, "updatedAt", void 0);
exports.SyllabusProgress = SyllabusProgress = __decorate([
    (0, typeorm_1.Entity)("syllabus_progress"),
    (0, typeorm_1.Unique)(["student", "syllabus"])
], SyllabusProgress);
//# sourceMappingURL=syllabus-progress.entity.js.map