import { Repository } from "typeorm";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { AuthenticatedUser } from "../auth";
export declare class SchoolAccessService {
    private readonly organizations;
    private readonly memberships;
    constructor(organizations: Repository<Organization>, memberships: Repository<OrganizationMembership>);
    isPlatform(user: AuthenticatedUser): boolean;
    organizationIds(user: AuthenticatedUser): Promise<string[]>;
    organizationForUser(user: AuthenticatedUser, organizationId: string): Promise<Organization>;
    scopedOrganizationIds(user: AuthenticatedUser, requested?: string): Promise<string[]>;
    activeMembershipForUser(userId: string, organizationId: string): Promise<OrganizationMembership | null>;
    activeMembershipsForUsers(userIds: string[], organizationId: string): Promise<OrganizationMembership[]>;
}
