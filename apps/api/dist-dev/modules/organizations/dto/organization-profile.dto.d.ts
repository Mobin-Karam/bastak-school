import type { OrganizationAuthProfile } from "@moshaver/api-contract";
export declare class UpdateOrganizationAuthProfileDto implements Partial<OrganizationAuthProfile> {
    name?: string;
    published?: boolean;
    displayName?: string;
    brandName?: string;
    description?: string;
    address?: string;
    phone?: string;
    location?: string;
    logoUrl?: string;
    backgroundUrl?: string;
    loginTitle?: string;
    signupTitle?: string;
    signupLabel?: string;
    securityNotice?: string;
}
