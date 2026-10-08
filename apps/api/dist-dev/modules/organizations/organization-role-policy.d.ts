import { OrganizationType } from "../../database/entities/organization.entity";
export declare const PLATFORM_ROLE_CODES: readonly ["PLATFORM_ADMIN"];
export declare const organizationRoleCodesByType: Record<OrganizationType, readonly string[]>;
export declare function roleCodesForOrganizationType(type: OrganizationType): readonly string[];
export declare function assertRoleCodesCompatibleWithOrganization(type: OrganizationType, roleCodes: readonly string[]): void;
export declare function assertPlatformRolesAreUnscoped(roleCodes: readonly string[], organizationId?: string): void;
