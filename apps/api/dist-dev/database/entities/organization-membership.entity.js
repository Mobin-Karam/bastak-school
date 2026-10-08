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
exports.OrganizationMembership = exports.MembershipStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
const user_role_assignment_entity_1 = require("./user-role-assignment.entity");
var MembershipStatus;
(function (MembershipStatus) {
    MembershipStatus["ACTIVE"] = "ACTIVE";
    MembershipStatus["INACTIVE"] = "INACTIVE";
    MembershipStatus["REMOVED"] = "REMOVED";
})(MembershipStatus || (exports.MembershipStatus = MembershipStatus = {}));
let OrganizationMembership = class OrganizationMembership {
    id;
    organization;
    user;
    status;
    joinedAt;
    createdAt;
    updatedAt;
    roleAssignments;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, user: { required: true, type: () => require("./user.entity").User }, status: { required: true, enum: require("./organization-membership.entity").MembershipStatus }, joinedAt: { required: true, type: () => Date }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, roleAssignments: { required: true, type: () => [require("./user-role-assignment.entity").UserRoleAssignment] } };
    }
};
exports.OrganizationMembership = OrganizationMembership;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], OrganizationMembership.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, (organization) => organization.memberships, {
        onDelete: "CASCADE",
    }),
    __metadata("design:type", organization_entity_1.Organization)
], OrganizationMembership.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], OrganizationMembership.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: MembershipStatus.ACTIVE }),
    __metadata("design:type", String)
], OrganizationMembership.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", default: () => "CURRENT_TIMESTAMP" }),
    __metadata("design:type", Date)
], OrganizationMembership.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], OrganizationMembership.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], OrganizationMembership.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_role_assignment_entity_1.UserRoleAssignment, (assignment) => assignment.membership),
    __metadata("design:type", Array)
], OrganizationMembership.prototype, "roleAssignments", void 0);
exports.OrganizationMembership = OrganizationMembership = __decorate([
    (0, typeorm_1.Entity)("organization_memberships"),
    (0, typeorm_1.Index)(["organization", "user"], { unique: true })
], OrganizationMembership);
//# sourceMappingURL=organization-membership.entity.js.map