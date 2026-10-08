import { Organization } from "./organization.entity";
import { User } from "./user.entity";
import { UserRoleAssignment } from "./user-role-assignment.entity";
export declare enum MembershipStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    REMOVED = "REMOVED"
}
export declare class OrganizationMembership {
    id: string;
    organization: Organization;
    user: User;
    status: MembershipStatus;
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    roleAssignments: UserRoleAssignment[];
}
