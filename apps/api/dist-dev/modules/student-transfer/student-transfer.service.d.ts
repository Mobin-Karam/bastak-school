import { DataSource, Repository } from "typeorm";
import { Student } from "../../database/entities/student.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { PreviewStudentImportDto } from "./student-transfer.dto";
export declare class StudentTransferService {
    private readonly students;
    private readonly dataSource;
    private readonly access;
    constructor(students: Repository<Student>, dataSource: DataSource, access: SchoolAccessService);
    preview(user: AuthenticatedUser, dto: PreviewStudentImportDto): Promise<{
        organization: {
            id: string;
            name: string;
        };
        total: number;
        valid: number;
        invalid: number;
        rows: {
            row: number;
            firstName: string;
            lastName: string;
            nationalCode: string | null;
            gradeId: number | null;
            educationTypeId: string;
            trackId: string;
            errors: string[];
        }[];
    }>;
    commit(user: AuthenticatedUser, dto: PreviewStudentImportDto): Promise<{
        organization: {
            id: string;
            name: string;
        };
        total: number;
        valid: number;
        invalid: number;
        rows: {
            row: number;
            firstName: string;
            lastName: string;
            nationalCode: string | null;
            gradeId: number | null;
            educationTypeId: string;
            trackId: string;
            errors: string[];
        }[];
        committed: boolean;
        count?: undefined;
        studentIds?: undefined;
    } | {
        committed: boolean;
        organization: {
            id: string;
            name: string;
        };
        count: number;
        studentIds: string[];
    }>;
    exportRows(user: AuthenticatedUser, organizationId?: string): Promise<{
        organizationId: string | null;
        organizationName: string;
        studentId: string;
        firstName: string;
        lastName: string;
        fullName: string;
        nationalCode: string;
        phoneNumber: string;
        gradeId: string | number;
        educationTypeId: string;
        trackId: string;
        registrationStatus: "ACTIVE" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "APPROVED" | "REJECTED";
        accountStatus: "active" | "archived" | "inactive";
    }[]>;
}
