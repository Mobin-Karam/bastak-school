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
exports.RegistrationProgress = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const student_entity_1 = require("./student.entity");
let RegistrationProgress = class RegistrationProgress {
    id;
    student;
    organization;
    sectionCode;
    status;
    reviewNote;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, organization: { required: true, type: () => require("./organization.entity").Organization }, sectionCode: { required: true, enum: ["LEGAL_GUARDIAN", "BASIC_INFORMATION", "IDENTITY_INFORMATION", "ADDRESS_CONTACT", "PARENTS", "PREVIOUS_EDUCATION", "DOCUMENTS", "HEALTH", "VACCINATION", "INSURANCE", "CONSENTS", "TRANSPORT", "TUITION", "EMERGENCY_CONTACT", "PHOTOGRAPHS"] }, status: { required: true, enum: ["IN_PROGRESS", "NEEDS_CORRECTION", "APPROVED", "REJECTED", "NOT_STARTED", "SUBMITTED", "VERIFIED"] }, reviewNote: { required: true, type: () => String }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.RegistrationProgress = RegistrationProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RegistrationProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], RegistrationProgress.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], RegistrationProgress.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 48 }),
    __metadata("design:type", String)
], RegistrationProgress.prototype, "sectionCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 24, default: "NOT_STARTED" }),
    __metadata("design:type", String)
], RegistrationProgress.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], RegistrationProgress.prototype, "reviewNote", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RegistrationProgress.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RegistrationProgress.prototype, "updatedAt", void 0);
exports.RegistrationProgress = RegistrationProgress = __decorate([
    (0, typeorm_1.Entity)("registration_progress"),
    (0, typeorm_1.Index)(["student", "organization", "sectionCode"], { unique: true })
], RegistrationProgress);
//# sourceMappingURL=registration-progress.entity.js.map