import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { MembershipStatus, OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization, OrganizationStatus } from "../../database/entities/organization.entity";
import { AuthenticatedUser } from "../auth";

@Injectable()
export class SchoolAccessService {
  constructor(
    @InjectRepository(Organization) private readonly organizations: Repository<Organization>,
    @InjectRepository(OrganizationMembership) private readonly memberships: Repository<OrganizationMembership>,
  ) {}

  isPlatform(user: AuthenticatedUser) {
    return user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN";
  }

  async organizationIds(user: AuthenticatedUser) {
    if (this.isPlatform(user)) {
      if (user.activeOrganizationId) {
        await this.organizationForUser(user, user.activeOrganizationId);
        return [user.activeOrganizationId];
      }
      const rows = await this.organizations.find({ where: { status: OrganizationStatus.ACTIVE }, select: { id: true } });
      return rows.map((row) => row.id);
    }
    if (user.organizationIds !== undefined) return [...new Set(user.organizationIds)];
    const rows = await this.memberships.find({
      where: { user: { id: user.id }, status: MembershipStatus.ACTIVE, organization: { status: OrganizationStatus.ACTIVE } },
      relations: { organization: true },
    });
    return rows.filter((row) => !user.activeOrganizationId || row.organization.id === user.activeOrganizationId)
      .map((row) => row.organization.id);
  }

  async organizationForUser(user: AuthenticatedUser, organizationId: string) {
    if (this.isPlatform(user)) {
      const organization = await this.organizations.findOne({ where: { id: organizationId, status: OrganizationStatus.ACTIVE } });
      if (!organization) throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان پیدا نشد.");
      return organization;
    }
    // Membership in B cannot reuse role/capability authority resolved for A.
    // Production AuthService supplies organizationIds even when it is empty.
    if ((user.activeOrganizationId && user.activeOrganizationId !== organizationId) ||
        (user.organizationIds !== undefined && !user.organizationIds.includes(organizationId)))
      throw new ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
    const membership = await this.memberships.findOne({
      where: { user: { id: user.id }, organization: { id: organizationId, status: OrganizationStatus.ACTIVE }, status: MembershipStatus.ACTIVE },
      relations: { organization: true },
    });
    if (!membership?.organization) throw new ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
    return membership.organization;
  }

  async scopedOrganizationIds(user: AuthenticatedUser, requested?: string) {
    if (requested) {
      await this.organizationForUser(user, requested);
      return [requested];
    }
    return this.organizationIds(user);
  }

  async activeMembershipForUser(userId: string, organizationId: string) {
    return this.memberships.findOne({
      where: { user: { id: userId }, organization: { id: organizationId }, status: MembershipStatus.ACTIVE },
      relations: { user: true, organization: true },
    });
  }

  async activeMembershipsForUsers(userIds: string[], organizationId: string) {
    if (!userIds.length) return [];
    return this.memberships.find({
      where: { user: { id: In(userIds) }, organization: { id: organizationId }, status: MembershipStatus.ACTIVE },
      relations: { user: true, organization: true },
    });
  }
}
