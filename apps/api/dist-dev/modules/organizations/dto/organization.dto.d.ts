import { OrganizationStatus, OrganizationType } from "../../../database/entities/organization.entity";
export declare class CreateOrganizationDto {
    name: string;
    type: OrganizationType;
    studentSignupManagedByOrganization?: boolean;
    studentSignupEnabled?: boolean;
    studentSignupLimit?: number;
}
export declare class UpdateOrganizationDto {
    name?: string;
    type?: OrganizationType;
    status?: OrganizationStatus;
}
export declare class SetOrganizationEnabledDto {
    enabled: boolean;
}
export declare class SetOrganizationFeaturesDto {
    enabledFeatures: string[];
}
export declare class AddMemberDto {
    userId: string;
    roleCodes: string[];
}
export declare class UpdateMemberDto {
    status?: "ACTIVE" | "INACTIVE";
    roleCodes?: string[];
}
