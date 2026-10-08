import { Student } from "./student.entity";
export declare class StudentProfile {
    id: string;
    student: Student;
    birthCertificateNumber?: string | null;
    birthDate?: Date | null;
    birthPlace?: string | null;
    certificateIssuePlace?: string | null;
    gender?: string | null;
    previousSchool?: string | null;
    address?: string | null;
    postalCode?: string | null;
    homePhone?: string | null;
    emergencyPhone?: string | null;
    healthNotes?: string | null;
    insuranceProvider?: string | null;
    insuranceNumber?: string | null;
    transportNotes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
