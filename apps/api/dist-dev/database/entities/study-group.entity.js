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
exports.StudyGroup = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const education_class_entity_1 = require("./education-class.entity");
const study_group_membership_entity_1 = require("./study-group-membership.entity");
let StudyGroup = class StudyGroup {
    id;
    organization;
    classroom;
    code;
    name;
    description;
    status;
    memberships;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, classroom: { required: false, type: () => require("./education-class.entity").EducationClass, nullable: true, description: "A school class can be split into one or more class groups." }, code: { required: true, type: () => String }, name: { required: true, type: () => String }, description: { required: true, type: () => String }, status: { required: true, enum: ["ARCHIVED", "ACTIVE"] }, memberships: { required: true, type: () => [require("./study-group-membership.entity").StudyGroupMembership] }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.StudyGroup = StudyGroup;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudyGroup.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], StudyGroup.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => education_class_entity_1.EducationClass, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], StudyGroup.prototype, "classroom", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80 }),
    __metadata("design:type", String)
], StudyGroup.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], StudyGroup.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], StudyGroup.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 24, default: "ACTIVE" }),
    __metadata("design:type", String)
], StudyGroup.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => study_group_membership_entity_1.StudyGroupMembership, (membership) => membership.group),
    __metadata("design:type", Array)
], StudyGroup.prototype, "memberships", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudyGroup.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudyGroup.prototype, "updatedAt", void 0);
exports.StudyGroup = StudyGroup = __decorate([
    (0, typeorm_1.Entity)("study_groups"),
    (0, typeorm_1.Index)(["organization", "code"], { unique: true })
], StudyGroup);
//# sourceMappingURL=study-group.entity.js.map