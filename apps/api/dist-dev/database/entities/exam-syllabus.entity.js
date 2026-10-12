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
exports.ExamSyllabus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const exam_entity_1 = require("./exam.entity");
let ExamSyllabus = class ExamSyllabus {
    id;
    exam;
    subject;
    description;
    required;
    track;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, exam: { required: true, type: () => require("./exam.entity").Exam }, subject: { required: true, type: () => String }, description: { required: true, type: () => String }, required: { required: true, type: () => Boolean }, track: { required: true, type: () => String } };
    }
};
exports.ExamSyllabus = ExamSyllabus;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ExamSyllabus.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => exam_entity_1.Exam, (exam) => exam.syllabus, { onDelete: "CASCADE" }),
    __metadata("design:type", exam_entity_1.Exam)
], ExamSyllabus.prototype, "exam", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], ExamSyllabus.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], ExamSyllabus.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ExamSyllabus.prototype, "required", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], ExamSyllabus.prototype, "track", void 0);
exports.ExamSyllabus = ExamSyllabus = __decorate([
    (0, typeorm_1.Entity)("exam_syllabus")
], ExamSyllabus);
//# sourceMappingURL=exam-syllabus.entity.js.map