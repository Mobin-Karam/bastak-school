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
exports.TeacherSubjectAssignment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const subject_entity_1 = require("./subject.entity");
const user_entity_1 = require("./user.entity");
let TeacherSubjectAssignment = class TeacherSubjectAssignment {
    id;
    teacher;
    subject;
    organization;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, teacher: { required: true, type: () => require("./user.entity").User }, subject: { required: true, type: () => require("./subject.entity").Subject }, organization: { required: true, type: () => require("./organization.entity").Organization }, createdAt: { required: true, type: () => Date } };
    }
};
exports.TeacherSubjectAssignment = TeacherSubjectAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TeacherSubjectAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], TeacherSubjectAssignment.prototype, "teacher", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subject_entity_1.Subject, { onDelete: "CASCADE" }),
    __metadata("design:type", subject_entity_1.Subject)
], TeacherSubjectAssignment.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], TeacherSubjectAssignment.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TeacherSubjectAssignment.prototype, "createdAt", void 0);
exports.TeacherSubjectAssignment = TeacherSubjectAssignment = __decorate([
    (0, typeorm_1.Entity)("teacher_subject_assignments"),
    (0, typeorm_1.Index)(["teacher", "subject", "organization"], { unique: true })
], TeacherSubjectAssignment);
//# sourceMappingURL=teacher-subject-assignment.entity.js.map