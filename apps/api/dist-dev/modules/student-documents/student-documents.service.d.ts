import { Repository } from "typeorm";
import { StudentDocument, DocumentStatus, DocumentTypeCode } from "../../database/entities/student-document.entity";
import { DocumentType } from "../../database/entities/document-type.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access/school-access.service";
export declare class StudentDocumentsService {
    private readonly documents;
    private readonly documentTypes;
    private readonly students;
    private readonly users;
    private readonly access;
    constructor(documents: Repository<StudentDocument>, documentTypes: Repository<DocumentType>, students: Repository<Student>, users: Repository<User>, access: SchoolAccessService);
    list(user: AuthenticatedUser, studentId?: string): Promise<{
        id: string;
        type: DocumentTypeCode;
        fileName: string;
        fileUrl: string;
        originalFileName: string | null | undefined;
        status: DocumentStatus;
        verificationNote: string | null | undefined;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    upload(user: AuthenticatedUser, studentId: string, type: string, file: Express.Multer.File | any): Promise<{
        id: string;
        type: DocumentType;
        fileName: string;
        fileUrl: string;
        originalFileName: string | null | undefined;
        status: DocumentStatus.PENDING;
        createdAt: Date;
    }>;
    verify(user: AuthenticatedUser, documentId: string, status: "VERIFIED" | "REJECTED", note?: string): Promise<{
        id: string;
        status: DocumentStatus;
        verificationNote: string;
        verifiedBy: AuthenticatedUser;
        updatedAt: Date;
    }>;
    private getStudent;
}
