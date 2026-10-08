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
exports.StudyGroupMembership = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const study_group_entity_1 = require("./study-group.entity");
let StudyGroupMembership = class StudyGroupMembership {
    id;
    group;
    student;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, group: { required: true, type: () => require("./study-group.entity").StudyGroup }, student: { required: true, type: () => require("./student.entity").Student }, createdAt: { required: true, type: () => Date } };
    }
};
exports.StudyGroupMembership = StudyGroupMembership;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudyGroupMembership.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => study_group_entity_1.StudyGroup, (group) => group.memberships, {
        onDelete: "CASCADE",
    }),
    __metadata("design:type", study_group_entity_1.StudyGroup)
], StudyGroupMembership.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], StudyGroupMembership.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudyGroupMembership.prototype, "createdAt", void 0);
exports.StudyGroupMembership = StudyGroupMembership = __decorate([
    (0, typeorm_1.Entity)("study_group_memberships"),
    (0, typeorm_1.Index)(["group", "student"], { unique: true })
], StudyGroupMembership);
//# sourceMappingURL=study-group-membership.entity.js.map