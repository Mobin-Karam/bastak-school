import { Repository } from "typeorm";
import { Organization } from "../../database/entities/organization.entity";
import { RegistrationProgress, RegistrationSectionStatus } from "../../database/entities/registration-progress.entity";
import { RegistrationRequirement } from "../../database/entities/registration-requirement.entity";
import { StudentContact } from "../../database/entities/student-contact.entity";
import { StudentProfile } from "../../database/entities/student-profile.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { RegistrationRequirementDto, ReviewRegistrationSectionDto, StudentContactDto, UpdateRegistrationProfileDto } from "./registration.dto";
export declare class RegistrationService {
    private readonly studentsRepo;
    private readonly profiles;
    private readonly contacts;
    private readonly requirementsRepo;
    private readonly progressRepo;
    private readonly organizations;
    private readonly access;
    constructor(studentsRepo: Repository<Student>, profiles: Repository<StudentProfile>, contacts: Repository<StudentContact>, requirementsRepo: Repository<RegistrationRequirement>, progressRepo: Repository<RegistrationProgress>, organizations: Repository<Organization>, access: SchoolAccessService);
    self(user: AuthenticatedUser): Promise<{
        student: {
            id: string;
            name: string;
            nationalCode: string | null | undefined;
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            organization: {
                id: string;
                name: string;
            };
        };
        profile: StudentProfile | null;
        contacts: StudentContact[];
        sections: {
            sectionCode: "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "LEGAL_GUARDIAN" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
            required: boolean;
            sortOrder: number;
            announcement: string;
            opensAt: Date | null | undefined;
            closesAt: Date | null | undefined;
            status: RegistrationSectionStatus;
            reviewNote: string;
        }[];
    }>;
    updateProfile(user: AuthenticatedUser, dto: UpdateRegistrationProfileDto): Promise<{
        student: {
            id: string;
            name: string;
            nationalCode: string | null | undefined;
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            organization: {
                id: string;
                name: string;
            };
        };
        profile: StudentProfile | null;
        contacts: StudentContact[];
        sections: {
            sectionCode: "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "LEGAL_GUARDIAN" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
            required: boolean;
            sortOrder: number;
            announcement: string;
            opensAt: Date | null | undefined;
            closesAt: Date | null | undefined;
            status: RegistrationSectionStatus;
            reviewNote: string;
        }[];
    }>;
    setContacts(user: AuthenticatedUser, input: StudentContactDto[]): Promise<{
        student: {
            id: string;
            name: string;
            nationalCode: string | null | undefined;
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            organization: {
                id: string;
                name: string;
            };
        };
        profile: StudentProfile | null;
        contacts: StudentContact[];
        sections: {
            sectionCode: "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "LEGAL_GUARDIAN" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
            required: boolean;
            sortOrder: number;
            announcement: string;
            opensAt: Date | null | undefined;
            closesAt: Date | null | undefined;
            status: RegistrationSectionStatus;
            reviewNote: string;
        }[];
    }>;
    submitSection(user: AuthenticatedUser, sectionCode: string, status: "IN_PROGRESS" | "SUBMITTED"): Promise<{
        student: {
            id: string;
            name: string;
            nationalCode: string | null | undefined;
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            organization: {
                id: string;
                name: string;
            };
        };
        profile: StudentProfile | null;
        contacts: StudentContact[];
        sections: {
            sectionCode: "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "LEGAL_GUARDIAN" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
            required: boolean;
            sortOrder: number;
            announcement: string;
            opensAt: Date | null | undefined;
            closesAt: Date | null | undefined;
            status: RegistrationSectionStatus;
            reviewNote: string;
        }[];
    }>;
    requirements(user: AuthenticatedUser, organizationId: string): Promise<RegistrationRequirement[]>;
    setRequirements(user: AuthenticatedUser, organizationId: string, input: RegistrationRequirementDto[]): Promise<RegistrationRequirement[]>;
    students(user: AuthenticatedUser, organizationId?: string): Promise<{
        id: string;
        name: string;
        nationalCode: string | null | undefined;
        phoneNumber: string | null;
        organizationId: string | null;
        registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
        createdAt: Date;
    }[]>;
    reviewSection(user: AuthenticatedUser, studentId: string, sectionCode: string, dto: ReviewRegistrationSectionDto): Promise<{
        studentId: string;
        sectionCode: "BASIC_INFORMATION" | "IDENTITY_INFORMATION" | "ADDRESS_CONTACT" | "PARENTS" | "PREVIOUS_EDUCATION" | "DOCUMENTS" | "HEALTH" | "VACCINATION" | "INSURANCE" | "CONSENTS" | "TRANSPORT" | "TUITION" | "LEGAL_GUARDIAN" | "EMERGENCY_CONTACT" | "PHOTOGRAPHS";
        status: RegistrationSectionStatus;
        reviewNote: string;
        registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
    }>;
    private ensureRequirements;
    private refreshStudentStatus;
    private selfStudent;
    private studentOrganization;
    private section;
}
