import { OrganizationType } from "../../database/entities/organization.entity";
import type { AuthenticatedUser } from "../auth";
export declare const PLATFORM_ROLE_CODES: readonly ["PLATFORM_ADMIN"];
export declare const PRINCIPAL_ASSIGNABLE_ROLE_CODES: readonly ["STUDENT", "SCHOOL_SUPERVISOR", "TEACHER"];
export declare const organizationRoleCodesByType: Record<OrganizationType, readonly string[]>;
export declare function roleCodesForOrganizationType(type: OrganizationType): readonly string[];
export declare function assertRoleCodesCompatibleWithOrganization(type: OrganizationType, roleCodes: readonly string[]): void;
export declare function assertPlatformRolesAreUnscoped(roleCodes: readonly string[], organizationId?: string): void;
export declare function assertRoleCodesAssignableByActor(actor: Pick<AuthenticatedUser, "role" | "roles">, roleCodes: readonly string[]): void;
