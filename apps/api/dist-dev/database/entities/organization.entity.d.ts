import { OrganizationMembership } from "./organization-membership.entity";
export declare enum OrganizationType {
    SCHOOL = "SCHOOL",
    ACADEMY = "ACADEMY",
    COUNSELING_CENTER = "COUNSELING_CENTER",
    PRIVATE_PRACTICE = "PRIVATE_PRACTICE",
    OTHER = "OTHER"
}
export declare enum OrganizationStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    ARCHIVED = "ARCHIVED"
}
export declare class Organization {
    id: string;
    name: string;
    type: OrganizationType;
    status: OrganizationStatus;
    disabledFeatures: string[];
    studentSignupManagedByOrganization: boolean;
    studentSignupEnabled: boolean;
    studentSignupLimit: number;
    studentSignupCount: number;
    createdAt: Date;
    updatedAt: Date;
    memberships: OrganizationMembership[];
}
