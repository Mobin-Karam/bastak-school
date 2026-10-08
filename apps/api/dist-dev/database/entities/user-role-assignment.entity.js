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
exports.UserRoleAssignment = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_membership_entity_1 = require("./organization-membership.entity");
const role_entity_1 = require("./role.entity");
const user_entity_1 = require("./user.entity");
let UserRoleAssignment = class UserRoleAssignment {
    id;
    user;
    role;
    membership;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, user: { required: true, type: () => require("./user.entity").User }, role: { required: true, type: () => require("./role.entity").Role }, membership: { required: false, type: () => require("./organization-membership.entity").OrganizationMembership, nullable: true }, createdAt: { required: true, type: () => Date } };
    }
};
exports.UserRoleAssignment = UserRoleAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], UserRoleAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], UserRoleAssignment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => role_entity_1.Role, { onDelete: "RESTRICT" }),
    __metadata("design:type", role_entity_1.Role)
], UserRoleAssignment.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_membership_entity_1.OrganizationMembership, (membership) => membership.roleAssignments, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], UserRoleAssignment.prototype, "membership", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserRoleAssignment.prototype, "createdAt", void 0);
exports.UserRoleAssignment = UserRoleAssignment = __decorate([
    (0, typeorm_1.Entity)("user_role_assignments"),
    (0, typeorm_1.Index)(["user", "role", "membership"], { unique: true })
], UserRoleAssignment);
//# sourceMappingURL=user-role-assignment.entity.js.map