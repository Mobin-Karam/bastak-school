import { DataSource } from "typeorm";
import { AssignStudentOnboardingDto, PlatformBootstrapDto, SetOrganizationStudentSignupDto, StudentSignupDto } from "./onboarding.dto";
import { EducationCatalogService } from "../education-catalog";
import { AuthenticatedUser } from "../auth";
export declare class OnboardingService {
    private dataSource;
    private catalog;
    constructor(dataSource: DataSource, catalog: EducationCatalogService);
    signup(dto: StudentSignupDto): Promise<{
        id: string;
        phoneNumber: string;
        name: string;
        registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
        organization: {
            id: string;
            name: string;
        };
    }>;
    publicSignupOptions(): Promise<{
        enabled: boolean;
        organizations: {
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
            remaining: number;
        }[];
    }>;
    setPlatformSignupPolicy(user: AuthenticatedUser, enabled: boolean): Promise<{
        enabled: boolean;
        organizations: {
            id: string;
            name: string;
            type: import("../../database/entities/organization.entity").OrganizationType;
            remaining: number;
        }[];
    }>;
    getPlatformSignupPolicy(user: AuthenticatedUser): Promise<{
        enabled: boolean;
    }>;
    setOrganizationSignupPolicy(user: AuthenticatedUser, organizationId: string, dto: SetOrganizationStudentSignupDto): Promise<{
        id: string;
        managedByOrganization: boolean;
        enabled: boolean;
        limit: number;
        used: number;
    }>;
    private platformSignupPolicy;
    platformBootstrapStatus(): Promise<{
        setupRequired: boolean;
    }>;
    bootstrapPlatformAdmin(dto: PlatformBootstrapDto): Promise<{
        id: string;
        phoneNumber: string | null | undefined;
        email: string | null | undefined;
        firstName: string;
        lastName: string;
    }>;
    pending(): Promise<{
        id: string;
        name: string;
        nationalCode: string | null | undefined;
        grade: string;
        major: string;
        username: string | undefined;
        createdAt: Date;
    }[]>;
    assign(studentId: string, dto: AssignStudentOnboardingDto): Promise<{
        studentId: string;
        organization: {
            id: string;
            name: string;
        };
        advisor: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        membershipId: string;
        relationshipId: string;
        conversationId: string;
        onboardingStatus: "ASSIGNED";
    }>;
    private automaticAssignment;
}
