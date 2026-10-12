import type { OrganizationAuthProfile } from "@moshaver/api-contract";
import { OrganizationMembership } from "./organization-membership.entity";
export declare enum OrganizationType {
    SCHOOL = "SCHOOL",
    INSTITUTION = "INSTITUTION",
    ORGANIZATION = "ORGANIZATION"
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
    authProfile: OrganizationAuthProfile | null;
    createdAt: Date;
    updatedAt: Date;
    memberships: OrganizationMembership[];
}
