import { DataSource, Repository } from "typeorm";
import { MembershipStatus, OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization, OrganizationStatus } from "../../database/entities/organization.entity";
import { Role } from "../../database/entities/role.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { AddMemberDto, CreateOrganizationDto, UpdateMemberDto, UpdateOrganizationDto } from "./dto/organization.dto";
export declare class OrganizationsService {
    private orgs;
    private members;
    private users;
    private roles;
    private assignments;
    private dataSource;
    private readonly tenancy;
    constructor(orgs: Repository<Organization>, members: Repository<OrganizationMembership>, users: Repository<User>, roles: Repository<Role>, assignments: Repository<UserRoleAssignment>, dataSource: DataSource);
    private platform;
    private assertScope;
    list(user: AuthenticatedUser): Promise<Organization[]>;
    get(user: AuthenticatedUser, id: string): Promise<Organization>;
    create(user: AuthenticatedUser, dto: CreateOrganizationDto): Promise<Organization>;
    update(user: AuthenticatedUser, id: string, dto: UpdateOrganizationDto): Promise<Organization>;
    setEnabled(user: AuthenticatedUser, id: string, enabled: boolean): Promise<Organization>;
    setFeatures(user: AuthenticatedUser, id: string, enabledFeatures: string[]): Promise<Organization>;
    archive(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        status: OrganizationStatus.ARCHIVED;
    }>;
    listMembers(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        user: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
            status: import("../../database/entities/user.entity").UserStatus;
        };
        status: MembershipStatus;
        roles: string[];
    }[]>;
    addMember(actor: AuthenticatedUser, organizationId: string, dto: AddMemberDto): Promise<{
        membershipId: string;
        userId: string;
        roles: string[];
    }>;
    updateMember(actor: AuthenticatedUser, organizationId: string, userId: string, dto: UpdateMemberDto): Promise<{
        userId: string;
        status: MembershipStatus;
        roles: string[] | undefined;
    }>;
    removeMember(actor: AuthenticatedUser, organizationId: string, userId: string): Promise<{
        removed: boolean;
    }>;
    private assertAssignable;
}
