import { Organization } from "./organization.entity";
export declare const REGISTRATION_SECTIONS: readonly ["BASIC_INFORMATION", "IDENTITY_INFORMATION", "ADDRESS_CONTACT", "PARENTS", "PREVIOUS_EDUCATION", "DOCUMENTS", "HEALTH", "VACCINATION", "INSURANCE", "CONSENTS", "TRANSPORT", "TUITION", "LEGAL_GUARDIAN", "EMERGENCY_CONTACT", "PHOTOGRAPHS"];
export type RegistrationSectionCode = (typeof REGISTRATION_SECTIONS)[number];
export declare class RegistrationRequirement {
    id: string;
    organization: Organization;
    sectionCode: RegistrationSectionCode;
    enabled: boolean;
    required: boolean;
    sortOrder: number;
    announcement: string;
    opensAt?: Date | null;
    closesAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
