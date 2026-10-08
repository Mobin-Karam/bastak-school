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
exports.Organization = exports.OrganizationStatus = exports.OrganizationType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_membership_entity_1 = require("./organization-membership.entity");
var OrganizationType;
(function (OrganizationType) {
    OrganizationType["SCHOOL"] = "SCHOOL";
    OrganizationType["ACADEMY"] = "ACADEMY";
    OrganizationType["COUNSELING_CENTER"] = "COUNSELING_CENTER";
    OrganizationType["PRIVATE_PRACTICE"] = "PRIVATE_PRACTICE";
    OrganizationType["OTHER"] = "OTHER";
})(OrganizationType || (exports.OrganizationType = OrganizationType = {}));
var OrganizationStatus;
(function (OrganizationStatus) {
    OrganizationStatus["ACTIVE"] = "ACTIVE";
    OrganizationStatus["INACTIVE"] = "INACTIVE";
    OrganizationStatus["ARCHIVED"] = "ARCHIVED";
})(OrganizationStatus || (exports.OrganizationStatus = OrganizationStatus = {}));
let Organization = class Organization {
    id;
    name;
    type;
    status;
    disabledFeatures;
    studentSignupManagedByOrganization;
    studentSignupEnabled;
    studentSignupLimit;
    studentSignupCount;
    createdAt;
    updatedAt;
    memberships;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, name: { required: true, type: () => String }, type: { required: true, enum: require("./organization.entity").OrganizationType }, status: { required: true, enum: require("./organization.entity").OrganizationStatus }, disabledFeatures: { required: true, type: () => [String] }, studentSignupManagedByOrganization: { required: true, type: () => Boolean, description: "Platform delegates the organization admin's ability to operate signup." }, studentSignupEnabled: { required: true, type: () => Boolean }, studentSignupLimit: { required: true, type: () => Number, description: "Total self-service accounts permitted for this organization; zero is closed." }, studentSignupCount: { required: true, type: () => Number, description: "Atomically reserved on successful self-service signup." }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, memberships: { required: true, type: () => [require("./organization-membership.entity").OrganizationMembership] } };
    }
};
exports.Organization = Organization;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Organization.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32 }),
    __metadata("design:type", String)
], Organization.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: OrganizationStatus.ACTIVE }),
    __metadata("design:type", String)
], Organization.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], Organization.prototype, "disabledFeatures", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Organization.prototype, "studentSignupManagedByOrganization", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Organization.prototype, "studentSignupEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Organization.prototype, "studentSignupLimit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], Organization.prototype, "studentSignupCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Organization.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Organization.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => organization_membership_entity_1.OrganizationMembership, (membership) => membership.organization),
    __metadata("design:type", Array)
], Organization.prototype, "memberships", void 0);
exports.Organization = Organization = __decorate([
    (0, typeorm_1.Entity)("organizations")
], Organization);
//# sourceMappingURL=organization.entity.js.map