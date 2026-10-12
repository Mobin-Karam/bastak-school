import { DataSource, Repository } from "typeorm";
import { Session } from "../../database/entities/session.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { User, UserStatus } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { CreateUserDto, SetRolesDto, UpdateUserDto } from "./dto/user.dto";
export declare class UsersService {
    private users;
    private assignments;
    private sessions;
    private dataSource;
    private readonly tenancy;
    constructor(users: Repository<User>, assignments: Repository<UserRoleAssignment>, sessions: Repository<Session>, dataSource: DataSource);
    private platform;
    private assertOrg;
    private assertRoles;
    private requirePlatformOwner;
    private assertProtectedAccount;
    private ensureActiveMembership;
    list(actor: AuthenticatedUser, organizationId?: string, roleCode?: string, status?: UserStatus): Promise<{
        id: string;
        username: string;
        phoneNumber: string | null | undefined;
        firstName: string;
        lastName: string;
        status: UserStatus;
        isPlatformOwner: boolean;
        assignments: {
            role: string;
            organizationId: string | null;
            capabilities: string[];
        }[];
    }[]>;
    get(actor: AuthenticatedUser, id: string): Promise<{
        id: string;
        username: string;
        phoneNumber: string | null | undefined;
        firstName: string;
        lastName: string;
        status: UserStatus;
        isPlatformOwner: boolean;
        assignments: {
            role: string;
            organizationId: string | null;
            capabilities: string[];
        }[];
    }>;
    create(actor: AuthenticatedUser, dto: CreateUserDto): Promise<{
        id: string;
        phoneNumber: string | null | undefined;
        roles: string[];
    }>;
    update(actor: AuthenticatedUser, id: string, dto: UpdateUserDto): Promise<{
        id: string;
        username: string;
        phoneNumber: string | null | undefined;
        firstName: string;
        lastName: string;
        status: UserStatus;
        isPlatformOwner: boolean;
        assignments: {
            role: string;
            organizationId: string | null;
            capabilities: string[];
        }[];
    }>;
    setActive(actor: AuthenticatedUser, id: string, active: boolean): Promise<{
        userId: string;
        status: UserStatus;
    }>;
    setRoles(actor: AuthenticatedUser, id: string, dto: SetRolesDto): Promise<{
        userId: string;
        roles: string[];
        organizationId: string | null;
    }>;
    archive(actor: AuthenticatedUser, id: string): Promise<{
        userId: string;
        status: UserStatus;
    }>;
    transferPlatformOwnership(actor: AuthenticatedUser, targetUserId: string): Promise<{
        previousOwnerId: string;
        ownerId: string;
        username: string;
    }>;
    capabilities(actor: AuthenticatedUser, id: string): Promise<{
        userId: string;
        capabilities: string[];
    }>;
    private project;
}
