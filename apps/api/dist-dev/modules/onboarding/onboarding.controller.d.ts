import { FastifyRequest } from "fastify";
import { AssignStudentOnboardingDto, PlatformBootstrapDto, SetOrganizationStudentSignupDto, SetPlatformStudentSignupDto, StudentSignupDto } from "./onboarding.dto";
import { AuthenticatedUser } from "../auth";
import { OnboardingService } from "./onboarding.service";
import { SignupThrottleService } from "./signup-throttle.service";
export declare class OnboardingController {
    private service;
    private signupThrottle;
    constructor(service: OnboardingService, signupThrottle: SignupThrottleService);
    signup(request: FastifyRequest, dto: StudentSignupDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            phoneNumber: string;
            name: string;
            registrationStatus: "ACTIVE" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED";
            organization: {
                id: string;
                name: string;
            };
        };
    }>;
    signupOptions(): Promise<{
        ok: boolean;
        data: {
            enabled: boolean;
            organizations: {
                id: string;
                name: string;
                type: import("../../database/entities/organization.entity").OrganizationType;
                remaining: number;
            }[];
        };
    }>;
    platformSignupPolicy(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            enabled: boolean;
        };
    }>;
    platformPolicy(user: AuthenticatedUser, dto: SetPlatformStudentSignupDto): Promise<{
        ok: boolean;
        data: {
            enabled: boolean;
            organizations: {
                id: string;
                name: string;
                type: import("../../database/entities/organization.entity").OrganizationType;
                remaining: number;
            }[];
        };
    }>;
    organizationPolicy(user: AuthenticatedUser, id: string, dto: SetOrganizationStudentSignupDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            managedByOrganization: boolean;
            enabled: boolean;
            limit: number;
            used: number;
        };
    }>;
    bootstrapStatus(): Promise<{
        ok: boolean;
        data: {
            setupRequired: boolean;
        };
    }>;
    bootstrap(request: FastifyRequest, dto: PlatformBootstrapDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            phoneNumber: string | null | undefined;
            email: string | null | undefined;
            firstName: string;
            lastName: string;
        };
    }>;
    pending(): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            nationalCode: string | null | undefined;
            grade: string;
            major: string;
            username: string | undefined;
            createdAt: Date;
        }[];
    }>;
    assign(id: string, dto: AssignStudentOnboardingDto): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
}
