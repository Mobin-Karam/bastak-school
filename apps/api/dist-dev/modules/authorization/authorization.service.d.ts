import { Repository } from "typeorm";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { Student } from "../../database/entities/student.entity";
import { Permission } from "../../database/entities/permission.entity";
import { UserCapabilityGrant } from "../../database/entities/user-capability-grant.entity";
export type UserContext = {
    id: string;
    username: string;
    sessionId: string;
    role: string;
    roles: string[];
    capabilities: string[];
    membershipIds: string[];
    organizationIds: string[];
};
export declare class AuthorizationService {
    private readonly assignments;
    private readonly memberships;
    private readonly relationships;
    private readonly students;
    private readonly permissions?;
    private readonly grants?;
    constructor(assignments: Repository<UserRoleAssignment>, memberships: Repository<OrganizationMembership>, relationships: Repository<UserRelationship>, students: Repository<Student>, permissions?: Repository<Permission> | undefined, grants?: Repository<UserCapabilityGrant> | undefined);
    enrich(base: {
        id: string;
        username: string;
        sessionId: string;
        role: string;
    }, requestedRole?: string, requestedOrganizationId?: string): Promise<UserContext>;
    hasCapability(context: UserContext, capability: string): boolean;
    requireCapability(context: UserContext, capability: string): void;
    canAccessOrganization(context: UserContext, organizationId: string, capability: string): boolean;
    canAccessStudent(context: UserContext, studentId: string, capability: string): Promise<boolean>;
}
