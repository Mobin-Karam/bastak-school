import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare enum DocumentTypeCode {
    SHENASNAME = "SHENASNAME",
    NATIONAL_CARD = "NATIONAL_CARD",
    PARENT_DOCUMENTS = "PARENT_DOCUMENTS",
    PERSONAL_PHOTO = "PERSONAL_PHOTO",
    HEALTH_RECORD = "HEALTH_RECORD",
    VACCINATION_RECORD = "VACCINATION_RECORD",
    INSURANCE_INFO = "INSURANCE_INFO",
    CONSENT_FORMS = "CONSENT_FORMS",
    TRANSPORT_INFO = "TRANSPORT_INFO",
    TUITION_INFO = "TUITION_INFO",
    LEGAL_GUARDIAN_SIGNATURE = "LEGAL_GUARDIAN_SIGNATURE"
}
export declare enum DocumentStatus {
    PENDING = "PENDING",
    SUBMITTED = "SUBMITTED",
    VERIFIED = "VERIFIED",
    REJECTED = "REJECTED",
    NEEDS_CORRECTION = "NEEDS_CORRECTION"
}
export declare class StudentDocument {
    id: string;
    student: Student;
    type: DocumentTypeCode;
    fileName: string;
    fileUrl: string;
    originalFileName?: string | null;
    status: DocumentStatus;
    verificationNote?: string | null;
    verifiedBy?: User | null;
    createdAt: Date;
    updatedAt: Date;
}
