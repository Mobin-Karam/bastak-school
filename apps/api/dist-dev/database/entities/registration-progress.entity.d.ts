import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { RegistrationSectionCode } from "./registration-requirement.entity";
export type RegistrationSectionStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "NEEDS_CORRECTION" | "VERIFIED" | "REJECTED";
export declare class RegistrationProgress {
    id: string;
    student: Student;
    organization: Organization;
    sectionCode: RegistrationSectionCode;
    status: RegistrationSectionStatus;
    reviewNote: string;
    createdAt: Date;
    updatedAt: Date;
}
