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
exports.EducationClassEnrollment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
let EducationClassEnrollment = class EducationClassEnrollment {
    id;
    classroom;
    student;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, classroom: { required: true, type: () => require("./education-class.entity").EducationClass }, student: { required: true, type: () => require("./student.entity").Student }, createdAt: { required: true, type: () => Date } };
    }
};
exports.EducationClassEnrollment = EducationClassEnrollment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EducationClassEnrollment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("EducationClass", (classroom) => classroom.enrollments, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", Function)
], EducationClassEnrollment.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], EducationClassEnrollment.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EducationClassEnrollment.prototype, "createdAt", void 0);
exports.EducationClassEnrollment = EducationClassEnrollment = __decorate([
    (0, typeorm_1.Entity)("education_class_enrollments"),
    (0, typeorm_1.Index)(["classroom", "student"], { unique: true })
], EducationClassEnrollment);
//# sourceMappingURL=education-class-enrollment.entity.js.map