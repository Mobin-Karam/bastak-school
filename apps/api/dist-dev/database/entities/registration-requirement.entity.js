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
exports.RegistrationRequirement = exports.REGISTRATION_SECTIONS = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
exports.REGISTRATION_SECTIONS = [
    "BASIC_INFORMATION",
    "IDENTITY_INFORMATION",
    "ADDRESS_CONTACT",
    "PARENTS",
    "PREVIOUS_EDUCATION",
    "DOCUMENTS",
    "HEALTH",
    "VACCINATION",
    "INSURANCE",
    "CONSENTS",
    "TRANSPORT",
    "TUITION",
    "LEGAL_GUARDIAN",
    "EMERGENCY_CONTACT",
    "PHOTOGRAPHS",
];
let RegistrationRequirement = class RegistrationRequirement {
    id;
    organization;
    sectionCode;
    enabled;
    required;
    sortOrder;
    announcement;
    opensAt;
    closesAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, sectionCode: { required: true, enum: ["LEGAL_GUARDIAN", "BASIC_INFORMATION", "IDENTITY_INFORMATION", "ADDRESS_CONTACT", "PARENTS", "PREVIOUS_EDUCATION", "DOCUMENTS", "HEALTH", "VACCINATION", "INSURANCE", "CONSENTS", "TRANSPORT", "TUITION", "EMERGENCY_CONTACT", "PHOTOGRAPHS"] }, enabled: { required: true, type: () => Boolean }, required: { required: true, type: () => Boolean }, sortOrder: { required: true, type: () => Number }, announcement: { required: true, type: () => String }, opensAt: { required: false, type: () => Date, nullable: true }, closesAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.RegistrationRequirement = RegistrationRequirement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RegistrationRequirement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], RegistrationRequirement.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 48 }),
    __metadata("design:type", String)
], RegistrationRequirement.prototype, "sectionCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], RegistrationRequirement.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], RegistrationRequirement.prototype, "required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], RegistrationRequirement.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], RegistrationRequirement.prototype, "announcement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], RegistrationRequirement.prototype, "opensAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], RegistrationRequirement.prototype, "closesAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RegistrationRequirement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RegistrationRequirement.prototype, "updatedAt", void 0);
exports.RegistrationRequirement = RegistrationRequirement = __decorate([
    (0, typeorm_1.Entity)("registration_requirements"),
    (0, typeorm_1.Index)(["organization", "sectionCode"], { unique: true })
], RegistrationRequirement);
//# sourceMappingURL=registration-requirement.entity.js.map