import { AuthenticatedUser } from "../auth";
import { CommitStudentImportDto, PreviewStudentImportDto } from "./student-transfer.dto";
import { StudentTransferService } from "./student-transfer.service";
export declare class StudentTransferController {
    private readonly transfer;
    constructor(transfer: StudentTransferService);
    preview(user: AuthenticatedUser, dto: PreviewStudentImportDto): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    commit(user: AuthenticatedUser, dto: CommitStudentImportDto): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    export(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
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
            registrationStatus: "APPROVED" | "REJECTED" | "ACCOUNT_CREATED" | "IN_PROGRESS" | "WAITING_REVIEW" | "NEEDS_CORRECTION" | "ACTIVE";
            accountStatus: "active" | "inactive" | "archived";
        }[];
    }>;
}
