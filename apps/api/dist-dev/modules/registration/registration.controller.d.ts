import { AuthenticatedUser } from "../auth";
import { ReviewRegistrationSectionDto, SetRegistrationRequirementsDto, SetStudentContactsDto, SubmitRegistrationSectionDto, UpdateRegistrationProfileDto } from "./registration.dto";
import { RegistrationService } from "./registration.service";
export declare class RegistrationController {
    private readonly registration;
    constructor(registration: RegistrationService);
    self(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            student: {
                id: string;
                name: string;
                nationalCode: string | null | undefined;
                registrationStatus: "ACTIVE" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED";
                organization: {
                    id: string;
                    name: string;
                };
            };
            profile: import("../../database/entities").StudentProfile | null;
            contacts: import("../../database/entities").StudentContact[];
            sections: {
                sectionCode: "LEGAL_GUARDIAN" | "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
                required: boolean;
                sortOrder: number;
                announcement: string;
                opensAt: Date | null | undefined;
                closesAt: Date | null | undefined;
                status: import("../../database/entities/registration-progress.entity").RegistrationSectionStatus;
                reviewNote: string;
            }[];
        };
    }>;
    profile(user: AuthenticatedUser, dto: UpdateRegistrationProfileDto): Promise<{
        ok: boolean;
        data: {
            student: {
                id: string;
                name: string;
                nationalCode: string | null | undefined;
                registrationStatus: "ACTIVE" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED";
                organization: {
                    id: string;
                    name: string;
                };
            };
            profile: import("../../database/entities").StudentProfile | null;
            contacts: import("../../database/entities").StudentContact[];
            sections: {
                sectionCode: "LEGAL_GUARDIAN" | "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
                required: boolean;
                sortOrder: number;
                announcement: string;
                opensAt: Date | null | undefined;
                closesAt: Date | null | undefined;
                status: import("../../database/entities/registration-progress.entity").RegistrationSectionStatus;
                reviewNote: string;
            }[];
        };
    }>;
    contacts(user: AuthenticatedUser, dto: SetStudentContactsDto): Promise<{
        ok: boolean;
        data: {
            student: {
                id: string;
                name: string;
                nationalCode: string | null | undefined;
                registrationStatus: "ACTIVE" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED";
                organization: {
                    id: string;
                    name: string;
                };
            };
            profile: import("../../database/entities").StudentProfile | null;
            contacts: import("../../database/entities").StudentContact[];
            sections: {
                sectionCode: "LEGAL_GUARDIAN" | "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
                required: boolean;
                sortOrder: number;
                announcement: string;
                opensAt: Date | null | undefined;
                closesAt: Date | null | undefined;
                status: import("../../database/entities/registration-progress.entity").RegistrationSectionStatus;
                reviewNote: string;
            }[];
        };
    }>;
    submit(user: AuthenticatedUser, sectionCode: string, dto: SubmitRegistrationSectionDto): Promise<{
        ok: boolean;
        data: {
            student: {
                id: string;
                name: string;
                nationalCode: string | null | undefined;
                registrationStatus: "ACTIVE" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED";
                organization: {
                    id: string;
                    name: string;
                };
            };
            profile: import("../../database/entities").StudentProfile | null;
            contacts: import("../../database/entities").StudentContact[];
            sections: {
                sectionCode: "LEGAL_GUARDIAN" | "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
                required: boolean;
                sortOrder: number;
                announcement: string;
                opensAt: Date | null | undefined;
                closesAt: Date | null | undefined;
                status: import("../../database/entities/registration-progress.entity").RegistrationSectionStatus;
                reviewNote: string;
            }[];
        };
    }>;
    requirements(user: AuthenticatedUser, organizationId: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").RegistrationRequirement[];
    }>;
    setRequirements(user: AuthenticatedUser, organizationId: string, dto: SetRegistrationRequirementsDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").RegistrationRequirement[];
    }>;
    students(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            nationalCode: string | null | undefined;
            phoneNumber: string | null;
            organizationId: string | null;
            registrationStatus: "ACTIVE" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED";
            createdAt: Date;
        }[];
    }>;
    review(user: AuthenticatedUser, studentId: string, sectionCode: string, dto: ReviewRegistrationSectionDto): Promise<{
        ok: boolean;
        data: {
            studentId: string;
            sectionCode: "LEGAL_GUARDIAN" | "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
            status: import("../../database/entities/registration-progress.entity").RegistrationSectionStatus;
            reviewNote: string;
            registrationStatus: "ACTIVE" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED";
        };
    }>;
}
