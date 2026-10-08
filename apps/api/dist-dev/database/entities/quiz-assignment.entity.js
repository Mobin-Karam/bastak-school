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
exports.QuizAssignment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const quiz_entity_1 = require("./quiz.entity");
const student_entity_1 = require("./student.entity");
let QuizAssignment = class QuizAssignment {
    id;
    quiz;
    student;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, quiz: { required: true, type: () => require("./quiz.entity").Quiz }, student: { required: true, type: () => require("./student.entity").Student }, createdAt: { required: true, type: () => Date } };
    }
};
exports.QuizAssignment = QuizAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], QuizAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiz_entity_1.Quiz, { onDelete: "CASCADE" }),
    __metadata("design:type", quiz_entity_1.Quiz)
], QuizAssignment.prototype, "quiz", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], QuizAssignment.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QuizAssignment.prototype, "createdAt", void 0);
exports.QuizAssignment = QuizAssignment = __decorate([
    (0, typeorm_1.Entity)("quiz_assignments"),
    (0, typeorm_1.Index)(["quiz", "student"], { unique: true })
], QuizAssignment);
//# sourceMappingURL=quiz-assignment.entity.js.map