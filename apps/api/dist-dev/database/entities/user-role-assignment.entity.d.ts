import { OrganizationMembership } from "./organization-membership.entity";
import { Role } from "./role.entity";
import { User } from "./user.entity";
export declare class UserRoleAssignment {
    id: string;
    user: User;
    role: Role;
    membership?: OrganizationMembership | null;
    createdAt: Date;
}
