import { AuthenticatedUser } from "../auth";
import { StudentDocumentsService } from "./student-documents.service";
export declare class StudentDocumentsController {
    private readonly documents;
    constructor(documents: StudentDocumentsService);
    list(user: AuthenticatedUser, studentId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/student-document.entity").DocumentTypeCode;
            fileName: string;
            fileUrl: string;
            originalFileName: string | null | undefined;
            status: import("../../database/entities/student-document.entity").DocumentStatus;
            verificationNote: string | null | undefined;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    upload(user: AuthenticatedUser, studentId: string, type: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            type: import("../../database/entities/document-type.entity").DocumentType;
            fileName: string;
            fileUrl: string;
            originalFileName: string | null | undefined;
            status: import("../../database/entities/student-document.entity").DocumentStatus.PENDING;
            createdAt: Date;
        };
    }>;
    verify(user: AuthenticatedUser, id: string, status: "VERIFIED" | "REJECTED", note?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: import("../../database/entities/student-document.entity").DocumentStatus;
            verificationNote: string;
            verifiedBy: AuthenticatedUser;
            updatedAt: Date;
        };
    }>;
}
