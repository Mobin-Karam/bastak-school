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
exports.SchoolAccessService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
let SchoolAccessService = class SchoolAccessService {
    organizations;
    memberships;
    constructor(organizations, memberships) {
        this.organizations = organizations;
        this.memberships = memberships;
    }
    isPlatform(user) {
        return user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN";
    }
    async organizationIds(user) {
        if (this.isPlatform(user)) {
            if (user.activeOrganizationId) {
                await this.organizationForUser(user, user.activeOrganizationId);
                return [user.activeOrganizationId];
            }
            const rows = await this.organizations.find({ where: { status: organization_entity_1.OrganizationStatus.ACTIVE }, select: { id: true } });
            return rows.map((row) => row.id);
        }
        if (user.organizationIds !== undefined)
            return [...new Set(user.organizationIds)];
        const rows = await this.memberships.find({
            where: { user: { id: user.id }, status: organization_membership_entity_1.MembershipStatus.ACTIVE, organization: { status: organization_entity_1.OrganizationStatus.ACTIVE } },
            relations: { organization: true },
        });
        return rows.filter((row) => !user.activeOrganizationId || row.organization.id === user.activeOrganizationId)
            .map((row) => row.organization.id);
    }
    async organizationForUser(user, organizationId) {
        if (this.isPlatform(user)) {
            const organization = await this.organizations.findOne({ where: { id: organizationId, status: organization_entity_1.OrganizationStatus.ACTIVE } });
            if (!organization)
                throw new api_exception_1.ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان پیدا نشد.");
            return organization;
        }
        if ((user.activeOrganizationId && user.activeOrganizationId !== organizationId) ||
            (user.organizationIds !== undefined && !user.organizationIds.includes(organizationId)))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        const membership = await this.memberships.findOne({
            where: { user: { id: user.id }, organization: { id: organizationId, status: organization_entity_1.OrganizationStatus.ACTIVE }, status: organization_membership_entity_1.MembershipStatus.ACTIVE },
            relations: { organization: true },
        });
        if (!membership?.organization)
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        return membership.organization;
    }
    async scopedOrganizationIds(user, requested) {
        if (requested) {
            await this.organizationForUser(user, requested);
            return [requested];
        }
        return this.organizationIds(user);
    }
    async activeMembershipForUser(userId, organizationId) {
        return this.memberships.findOne({
            where: { user: { id: userId }, organization: { id: organizationId }, status: organization_membership_entity_1.MembershipStatus.ACTIVE },
            relations: { user: true, organization: true },
        });
    }
    async activeMembershipsForUsers(userIds, organizationId) {
        if (!userIds.length)
            return [];
        return this.memberships.find({
            where: { user: { id: (0, typeorm_2.In)(userIds) }, organization: { id: organizationId }, status: organization_membership_entity_1.MembershipStatus.ACTIVE },
            relations: { user: true, organization: true },
        });
    }
};
exports.SchoolAccessService = SchoolAccessService;
exports.SchoolAccessService = SchoolAccessService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SchoolAccessService);
//# sourceMappingURL=school-access.service.js.map