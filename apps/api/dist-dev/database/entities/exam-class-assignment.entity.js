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
exports.ExamClassAssignment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const education_class_entity_1 = require("./education-class.entity");
const exam_entity_1 = require("./exam.entity");
let ExamClassAssignment = class ExamClassAssignment {
    id;
    exam;
    classroom;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, exam: { required: true, type: () => require("./exam.entity").Exam }, classroom: { required: true, type: () => require("./education-class.entity").EducationClass }, createdAt: { required: true, type: () => Date } };
    }
};
exports.ExamClassAssignment = ExamClassAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ExamClassAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => exam_entity_1.Exam, { onDelete: "CASCADE" }),
    __metadata("design:type", exam_entity_1.Exam)
], ExamClassAssignment.prototype, "exam", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => education_class_entity_1.EducationClass, { onDelete: "CASCADE" }),
    __metadata("design:type", education_class_entity_1.EducationClass)
], ExamClassAssignment.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ExamClassAssignment.prototype, "createdAt", void 0);
exports.ExamClassAssignment = ExamClassAssignment = __decorate([
    (0, typeorm_1.Entity)("exam_class_assignments"),
    (0, typeorm_1.Index)(["exam", "classroom"], { unique: true })
], ExamClassAssignment);
//# sourceMappingURL=exam-class-assignment.entity.js.map