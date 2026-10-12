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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationService = void 0;
const common_1 = require("@nestjs/common");
const cmb_authorization_1 = require("@moshaver/cmb-authorization");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const permission_entity_1 = require("../../database/entities/permission.entity");
const user_capability_grant_entity_1 = require("../../database/entities/user-capability-grant.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const organizations_1 = require("../organizations");
let AuthorizationService = class AuthorizationService {
    assignments;
    memberships;
    relationships;
    students;
    permissions;
    grants;
    constructor(assignments, memberships, relationships, students, permissions, grants) {
        this.assignments = assignments;
        this.memberships = memberships;
        this.relationships = relationships;
        this.students = students;
        this.permissions = permissions;
        this.grants = grants;
    }
    async enrich(base, requestedRole, requestedOrganizationId) {
        const [assignments, memberships] = await Promise.all([
            this.assignments.find({
                where: { user: { id: base.id } },
                relations: {
                    role: { permissions: { permission: true } },
                    membership: { organization: true },
                },
            }),
            this.memberships.find({
                where: {
                    user: { id: base.id },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                    organization: { status: organization_entity_1.OrganizationStatus.ACTIVE },
                },
                relations: { organization: true },
            }),
        ]);
        const activeMembershipIds = new Set(memberships.map((membership) => membership.id));
        const activeAssignments = assignments.filter((assignment) => !assignment.role.organizationScoped ||
            Boolean(assignment.membership?.id &&
                activeMembershipIds.has(assignment.membership.id)));
        const fallback = base.role === "ADMIN" ? null : base.role;
        const allRoles = [
            ...new Set(activeAssignments
                .map((item) => item.role.code)
                .concat(activeAssignments.length || !fallback ? [] : [fallback])),
        ];
        if (requestedRole && !allRoles.includes(requestedRole))
            throw new api_exception_1.ApiException(403, "WORK_CONTEXT_FORBIDDEN", "زمینه کاری انتخاب‌شده در دسترس نیست.");
        if (requestedOrganizationId &&
            !memberships.some((item) => item.organization.id === requestedOrganizationId) &&
            !allRoles.includes("PLATFORM_ADMIN"))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        const featureOrganization = memberships.find((membership) => membership.organization.id === requestedOrganizationId);
        const disabledFeatures = allRoles.includes("PLATFORM_ADMIN")
            ? []
            : featureOrganization
                ? (featureOrganization.organization.disabledFeatures ?? [])
                : memberships.flatMap((membership) => membership.organization.disabledFeatures ?? []);
        const context = (0, cmb_authorization_1.buildAuthorizationContext)(base, activeAssignments.map((item) => ({
            role: item.role.code,
            organizationScoped: item.role.organizationScoped,
            organizationId: item.membership?.organization?.id,
            capabilities: item.role.permissions
                .map((rp) => rp.permission.code)
                .filter((capability) => (0, organizations_1.isCapabilityEnabledForOrganization)(capability, disabledFeatures)),
        })), memberships.map((item) => ({
            id: item.id,
            organizationId: item.organization.id,
        })), { requestedRole, requestedOrganizationId });
        const unscopedCapabilities = activeAssignments
            .filter((item) => !item.role.organizationScoped &&
            (!requestedRole || item.role.code === requestedRole))
            .flatMap((item) => item.role.permissions.map((rp) => rp.permission.code))
            .filter((capability) => (0, organizations_1.isCapabilityEnabledForOrganization)(capability, disabledFeatures));
        const effectiveCapabilities = [
            ...new Set([...context.capabilities, ...unscopedCapabilities]),
        ].sort();
        const grantCapabilities = this.grants
            ? (await this.grants.find({
                where: {
                    user: { id: base.id },
                    organization: {
                        id: (0, typeorm_2.In)(memberships.map((item) => item.organization.id)),
                    },
                },
                relations: { organization: true },
            }))
                .filter((grant) => !requestedOrganizationId ||
                grant.organization.id === requestedOrganizationId)
                .filter((grant) => (0, organizations_1.isCapabilityEnabledForOrganization)(grant.capability, disabledFeatures))
                .map((grant) => grant.capability)
            : [];
        if (!context.roles.includes("PLATFORM_ADMIN") || !this.permissions)
            return {
                ...context,
                activeOrganizationId: requestedOrganizationId,
                capabilities: [
                    ...new Set([...effectiveCapabilities, ...grantCapabilities]),
                ].sort(),
            };
        const permissions = await this.permissions.find({ select: { code: true } });
        return {
            ...context,
            activeOrganizationId: requestedOrganizationId,
            capabilities: [
                ...new Set([
                    ...effectiveCapabilities,
                    ...grantCapabilities,
                    ...permissions.map((item) => item.code),
                ]),
            ].sort(),
        };
    }
    hasCapability(context, capability) {
        return (0, cmb_authorization_1.hasCapability)(context, capability);
    }
    requireCapability(context, capability) {
        if (!this.hasCapability(context, capability))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    }
    canAccessOrganization(context, organizationId, capability) {
        return (0, cmb_authorization_1.canAccessOrganization)(context, organizationId, capability);
    }
    async canAccessStudent(context, studentId, capability) {
        if (!this.hasCapability(context, capability))
            return false;
        if (context.roles.includes("PLATFORM_ADMIN"))
            return true;
        const student = await this.students.findOne({
            where: { id: studentId },
            relations: { user: true, organization: true },
        });
        if (!student)
            return false;
        if (student.user?.id === context.id)
            return true;
        if ([
            "ORGANIZATION_ADMIN",
            "PRINCIPAL",
            "SCHOOL_SUPERVISOR",
            "DISCIPLINARIAN",
            "RELIGIOUS_EDUCATION_MANAGER",
            "GOVERNMENT_EDUCATION_MANAGER",
        ].some((role) => context.roles.includes(role))) {
            if (student.organization?.id &&
                context.organizationIds.includes(student.organization.id))
                return true;
            if (!student.user?.id)
                return false;
            const sharedMembership = await this.memberships.findOne({
                where: {
                    user: { id: student.user.id },
                    organization: { id: (0, typeorm_2.In)(context.organizationIds) },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                },
            });
            if (sharedMembership)
                return true;
        }
        const relation = await this.relationships.findOne({
            where: {
                fromUser: { id: context.id },
                toStudent: { id: studentId },
                status: user_relationship_entity_1.RelationshipStatus.ACTIVE,
            },
        });
        return Boolean(relation);
    }
};
exports.AuthorizationService = AuthorizationService;
exports.AuthorizationService = AuthorizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_role_assignment_entity_1.UserRoleAssignment)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(2, (0, typeorm_1.InjectRepository)(user_relationship_entity_1.UserRelationship)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(4, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __param(5, (0, typeorm_1.InjectRepository)(user_capability_grant_entity_1.UserCapabilityGrant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthorizationService);
//# sourceMappingURL=authorization.service.js.map