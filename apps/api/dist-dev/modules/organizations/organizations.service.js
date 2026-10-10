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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const cmb_tenancy_1 = require("@moshaver/cmb-tenancy");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const role_entity_1 = require("../../database/entities/role.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const chat_1 = require("../chat");
const organization_features_1 = require("./organization-features");
const organization_role_policy_1 = require("./organization-role-policy");
let OrganizationsService = class OrganizationsService {
    orgs;
    members;
    users;
    roles;
    assignments;
    dataSource;
    tenancy = new cmb_tenancy_1.TenancyPolicy();
    constructor(orgs, members, users, roles, assignments, dataSource) {
        this.orgs = orgs;
        this.members = members;
        this.users = users;
        this.roles = roles;
        this.assignments = assignments;
        this.dataSource = dataSource;
    }
    platform(user) {
        return this.tenancy.isPlatformActor(user);
    }
    assertScope(user, id) {
        if (!this.tenancy.canAccessOrganization(user, id))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
    }
    async list(user) {
        return this.platform(user)
            ? this.orgs.find({ order: { name: "ASC" } })
            : this.orgs.find({
                where: {
                    status: organization_entity_1.OrganizationStatus.ACTIVE,
                    memberships: {
                        user: { id: user.id },
                        status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                    },
                },
                order: { name: "ASC" },
            });
    }
    async get(user, id) {
        this.assertScope(user, id);
        const org = await this.orgs.findOne({ where: { id } });
        if (!org)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
        return org;
    }
    create(user, dto) {
        if (!this.platform(user))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند سازمان بسازد.");
        return this.dataSource.transaction(async (manager) => {
            const organization = await manager.save(organization_entity_1.Organization, manager.create(organization_entity_1.Organization, dto));
            await (0, chat_1.ensureOrganizationChat)(manager, organization);
            return organization;
        });
    }
    async update(user, id, dto) {
        this.assertScope(user, id);
        if (dto.status && !this.platform(user))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند وضعیت سازمان را تغییر دهد.");
        const org = await this.get(user, id);
        if (dto.type && dto.type !== org.type)
            await this.assertTypeChangeIsCompatible(id, dto.type);
        Object.assign(org, dto);
        return this.orgs.save(org);
    }
    async setEnabled(user, id, enabled) {
        if (!this.platform(user))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند دسترسی سازمان را فعال یا غیرفعال کند.");
        const org = await this.get(user, id);
        if (org.status === organization_entity_1.OrganizationStatus.ARCHIVED)
            throw new api_exception_1.ApiException(409, "ORGANIZATION_ARCHIVED", "سازمان بایگانی‌شده را ابتدا بازیابی کنید.");
        org.status = enabled
            ? organization_entity_1.OrganizationStatus.ACTIVE
            : organization_entity_1.OrganizationStatus.INACTIVE;
        return this.orgs.save(org);
    }
    async setFeatures(user, id, enabledFeatures) {
        if (!this.platform(user))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند قابلیت‌های سازمان را تغییر دهد.");
        if (!enabledFeatures.every(organization_features_1.isOrganizationFeatureCode))
            throw new api_exception_1.ApiException(400, "INVALID_ORGANIZATION_FEATURE", "قابلیت سازمانی نامعتبر است.");
        const org = await this.get(user, id);
        org.disabledFeatures = organization_features_1.ORGANIZATION_FEATURES.map((feature) => feature.code).filter((code) => !enabledFeatures.includes(code));
        return this.orgs.save(org);
    }
    async archive(user, id) {
        if (!this.platform(user))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند سازمان را بایگانی کند.");
        const org = await this.get(user, id);
        org.status = organization_entity_1.OrganizationStatus.ARCHIVED;
        await this.orgs.save(org);
        return { id, status: org.status };
    }
    async listMembers(user, id) {
        this.assertScope(user, id);
        return this.members
            .find({
            where: { organization: { id } },
            relations: { user: true, roleAssignments: { role: true } },
        })
            .then((items) => items.map((m) => ({
            id: m.id,
            user: {
                id: m.user.id,
                username: m.user.username,
                firstName: m.user.firstName,
                lastName: m.user.lastName,
                status: m.user.status,
            },
            status: m.status,
            roles: m.roleAssignments.map((a) => a.role.code),
        })));
    }
    async addMember(actor, organizationId, dto) {
        this.assertScope(actor, organizationId);
        this.assertAssignable(actor, dto.roleCodes);
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(user_entity_1.User, { where: { id: dto.userId } });
            const org = await manager.findOne(organization_entity_1.Organization, {
                where: { id: organizationId },
            });
            if (!user || !org)
                throw new api_exception_1.ApiException(404, "NOT_FOUND", "کاربر یا سازمان یافت نشد.");
            (0, organization_role_policy_1.assertRoleCodesCompatibleWithOrganization)(org.type, dto.roleCodes);
            let membership = await manager.findOne(organization_membership_entity_1.OrganizationMembership, {
                where: { user: { id: user.id }, organization: { id: org.id } },
            });
            membership = await manager.save(organization_membership_entity_1.OrganizationMembership, membership
                ? Object.assign(membership, { status: organization_membership_entity_1.MembershipStatus.ACTIVE })
                : manager.create(organization_membership_entity_1.OrganizationMembership, { user, organization: org }));
            const roles = await manager.find(role_entity_1.Role, {
                where: { code: (0, typeorm_2.In)(dto.roleCodes), organizationScoped: true },
            });
            if (roles.length !== new Set(dto.roleCodes).size)
                throw new api_exception_1.ApiException(400, "INVALID_ROLE", "نقش سازمانی نامعتبر است.");
            for (const role of roles)
                await manager.save(user_role_assignment_entity_1.UserRoleAssignment, manager.create(user_role_assignment_entity_1.UserRoleAssignment, { user, role, membership }));
            await (0, chat_1.ensureOrganizationChat)(manager, org, user);
            return {
                membershipId: membership.id,
                userId: user.id,
                roles: roles.map((r) => r.code),
            };
        });
    }
    async updateMember(actor, organizationId, userId, dto) {
        this.assertScope(actor, organizationId);
        if (dto.roleCodes)
            this.assertAssignable(actor, dto.roleCodes);
        return this.dataSource.transaction(async (manager) => {
            const membership = await manager.findOne(organization_membership_entity_1.OrganizationMembership, {
                where: { organization: { id: organizationId }, user: { id: userId } },
                relations: { user: true },
            });
            if (!membership)
                throw new api_exception_1.ApiException(404, "NOT_FOUND", "عضویت یافت نشد.");
            if (dto.status)
                membership.status = dto.status;
            await manager.save(membership);
            if (dto.roleCodes) {
                const organization = await manager.findOneByOrFail(organization_entity_1.Organization, {
                    id: organizationId,
                });
                (0, organization_role_policy_1.assertRoleCodesCompatibleWithOrganization)(organization.type, dto.roleCodes);
                await manager.delete(user_role_assignment_entity_1.UserRoleAssignment, {
                    membership: { id: membership.id },
                });
                const roles = await manager.find(role_entity_1.Role, {
                    where: { code: (0, typeorm_2.In)(dto.roleCodes), organizationScoped: true },
                });
                if (roles.length !== new Set(dto.roleCodes).size)
                    throw new api_exception_1.ApiException(400, "INVALID_ROLE", "نقش سازمانی نامعتبر است.");
                for (const role of roles)
                    await manager.save(user_role_assignment_entity_1.UserRoleAssignment, manager.create(user_role_assignment_entity_1.UserRoleAssignment, {
                        user: membership.user,
                        membership,
                        role,
                    }));
            }
            if (membership.status === organization_membership_entity_1.MembershipStatus.ACTIVE) {
                const organization = await manager.findOneByOrFail(organization_entity_1.Organization, {
                    id: organizationId,
                });
                await (0, chat_1.ensureOrganizationChat)(manager, organization, membership.user);
            }
            else
                await (0, chat_1.leaveOrganizationChat)(manager, organizationId, userId);
            return { userId, status: membership.status, roles: dto.roleCodes };
        });
    }
    async removeMember(actor, organizationId, userId) {
        this.assertScope(actor, organizationId);
        return this.dataSource.transaction(async (manager) => {
            const membership = await manager.findOne(organization_membership_entity_1.OrganizationMembership, {
                where: { organization: { id: organizationId }, user: { id: userId } },
            });
            if (!membership)
                throw new api_exception_1.ApiException(404, "NOT_FOUND", "عضویت یافت نشد.");
            membership.status = organization_membership_entity_1.MembershipStatus.REMOVED;
            await manager.save(organization_membership_entity_1.OrganizationMembership, membership);
            await (0, chat_1.leaveOrganizationChat)(manager, organizationId, userId);
            return { removed: true };
        });
    }
    assertAssignable(actor, roles) {
        if (!this.tenancy.canAssignRoles(actor, roles))
            throw new api_exception_1.ApiException(403, "ROLE_ESCALATION", "تخصیص این نقش مجاز نیست.");
        (0, organization_role_policy_1.assertRoleCodesAssignableByActor)(actor, roles);
    }
    async assertTypeChangeIsCompatible(organizationId, type) {
        const assignments = await this.assignments.find({
            where: { membership: { organization: { id: organizationId } } },
            relations: { role: true },
        });
        (0, organization_role_policy_1.assertRoleCodesCompatibleWithOrganization)(type, assignments.map((assignment) => assignment.role.code));
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(4, (0, typeorm_1.InjectRepository)(user_role_assignment_entity_1.UserRoleAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map