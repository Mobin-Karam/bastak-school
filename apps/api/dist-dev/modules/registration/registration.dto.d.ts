export declare class UpdateRegistrationProfileDto {
    nationalCode?: string;
    birthCertificateNumber?: string;
    birthDate?: string;
    birthPlace?: string;
    certificateIssuePlace?: string;
    gender?: string;
    gradeId?: number;
    educationTypeId?: string;
    trackId?: string;
    previousSchool?: string;
    address?: string;
    postalCode?: string;
    homePhone?: string;
    emergencyPhone?: string;
    healthNotes?: string;
    insuranceProvider?: string;
    insuranceNumber?: string;
    transportNotes?: string;
}
export declare class StudentContactDto {
    type: "FATHER" | "MOTHER" | "LEGAL_GUARDIAN" | "EMERGENCY";
    fullName: string;
    nationalCode?: string;
    phoneNumber?: string;
    occupation?: string;
}
export declare class SetStudentContactsDto {
    contacts: StudentContactDto[];
}
export declare class RegistrationRequirementDto {
    sectionCode: string;
    enabled: boolean;
    required: boolean;
    sortOrder: number;
    announcement?: string;
    opensAt?: string;
    closesAt?: string;
}
export declare class SetRegistrationRequirementsDto {
    requirements: RegistrationRequirementDto[];
}
export declare class SubmitRegistrationSectionDto {
    status: "IN_PROGRESS" | "SUBMITTED";
}
export declare class ReviewRegistrationSectionDto {
    status: "APPROVED" | "NEEDS_CORRECTION";
    reviewNote?: string;
}
