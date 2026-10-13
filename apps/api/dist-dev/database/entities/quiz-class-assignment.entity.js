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
exports.QuizClassAssignment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const education_class_entity_1 = require("./education-class.entity");
const quiz_entity_1 = require("./quiz.entity");
let QuizClassAssignment = class QuizClassAssignment {
    id;
    quiz;
    classroom;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, quiz: { required: true, type: () => require("./quiz.entity").Quiz }, classroom: { required: true, type: () => require("./education-class.entity").EducationClass }, createdAt: { required: true, type: () => Date } };
    }
};
exports.QuizClassAssignment = QuizClassAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], QuizClassAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quiz_entity_1.Quiz, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", quiz_entity_1.Quiz)
], QuizClassAssignment.prototype, "quiz", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => education_class_entity_1.EducationClass, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", education_class_entity_1.EducationClass)
], QuizClassAssignment.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], QuizClassAssignment.prototype, "createdAt", void 0);
exports.QuizClassAssignment = QuizClassAssignment = __decorate([
    (0, typeorm_1.Entity)("quiz_class_assignments"),
    (0, typeorm_1.Index)(["quiz", "classroom"], { unique: true })
], QuizClassAssignment);
//# sourceMappingURL=quiz-class-assignment.entity.js.map