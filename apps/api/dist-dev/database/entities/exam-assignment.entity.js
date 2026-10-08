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
exports.ExamAssignment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const exam_entity_1 = require("./exam.entity");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
let ExamAssignment = class ExamAssignment {
    id;
    exam;
    student;
    assignedBy;
    assignedAt;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, exam: { required: true, type: () => require("./exam.entity").Exam }, student: { required: true, type: () => require("./student.entity").Student }, assignedBy: { required: true, type: () => require("./user.entity").User }, assignedAt: { required: true, type: () => Date }, createdAt: { required: true, type: () => Date } };
    }
};
exports.ExamAssignment = ExamAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ExamAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => exam_entity_1.Exam, exam => exam.assignments, { onDelete: "CASCADE" }),
    __metadata("design:type", exam_entity_1.Exam)
], ExamAssignment.prototype, "exam", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], ExamAssignment.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "RESTRICT" }),
    __metadata("design:type", user_entity_1.User)
], ExamAssignment.prototype, "assignedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ExamAssignment.prototype, "assignedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ExamAssignment.prototype, "createdAt", void 0);
exports.ExamAssignment = ExamAssignment = __decorate([
    (0, typeorm_1.Entity)("exam_assignments"),
    (0, typeorm_1.Index)(["exam", "student"], { unique: true })
], ExamAssignment);
//# sourceMappingURL=exam-assignment.entity.js.map