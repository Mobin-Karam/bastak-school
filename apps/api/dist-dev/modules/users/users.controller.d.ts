import { UserStatus } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { CreateUserDto, SetRolesDto, TransferPlatformOwnershipDto, UpdateUserDto } from "./dto/user.dto";
import { UsersService } from "./users.service";
export declare class UsersController {
    private service;
    constructor(service: UsersService);
    list(u: AuthenticatedUser, o?: string, r?: string, s?: UserStatus): Promise<{
        ok: boolean;
        data: {
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
        }[];
    }>;
    create(u: AuthenticatedUser, d: CreateUserDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            phoneNumber: string | null | undefined;
            roles: string[];
        };
    }>;
    get(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    update(u: AuthenticatedUser, id: string, d: UpdateUserDto): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    activate(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            userId: string;
            status: UserStatus;
        };
    }>;
    deactivate(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            userId: string;
            status: UserStatus;
        };
    }>;
    archive(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            userId: string;
            status: UserStatus;
        };
    }>;
    roles(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            role: string;
            organizationId: string | null;
            capabilities: string[];
        }[];
    }>;
    setRoles(u: AuthenticatedUser, id: string, d: SetRolesDto): Promise<{
        ok: boolean;
        data: {
            userId: string;
            roles: string[];
            organizationId: string | null;
        };
    }>;
    transferPlatformOwnership(u: AuthenticatedUser, d: TransferPlatformOwnershipDto): Promise<{
        ok: boolean;
        data: {
            previousOwnerId: string;
            ownerId: string;
            username: string;
        };
    }>;
    capabilities(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            userId: string;
            capabilities: string[];
        };
    }>;
}
