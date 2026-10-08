import { AuthenticatedUser, AuthService } from "./auth.service";
export declare class MeController {
    private readonly auth;
    constructor(auth: AuthService);
    context(user: AuthenticatedUser | null, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            user: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
                status: import("../../database/entities/user.entity").UserStatus;
                isPlatformOwner: boolean;
                locale: string;
                timezone: string;
            };
            roles: string[];
            capabilities: string[];
            workContexts: {
                role: string;
                capabilities: string[];
            }[];
            memberships: {
                membershipId: string;
                id: string;
                name: string;
                type: import("../../database/entities/organization.entity").OrganizationType;
            }[];
            activeOrganization: {
                membershipId: string;
                id: string;
                name: string;
                type: import("../../database/entities/organization.entity").OrganizationType;
            } | null;
            availableOrganizations: {
                membershipId: string;
                id: string;
                name: string;
                type: import("../../database/entities/organization.entity").OrganizationType;
            }[];
        };
    }>;
}
