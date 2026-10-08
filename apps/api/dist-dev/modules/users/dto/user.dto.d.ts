export declare class CreateUserDto {
    phoneNumber: string;
    password: string;
    firstName?: string;
    lastName?: string;
    organizationId?: string;
    roleCodes: string[];
}
export declare class UpdateUserDto {
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    locale?: string;
    timezone?: string;
}
export declare class SetRolesDto {
    roleCodes: string[];
    organizationId?: string;
}
export declare class TransferPlatformOwnershipDto {
    targetUserId: string;
}
