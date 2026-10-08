import { StudentDocument } from "./student-document.entity";
export declare class DocumentType {
    id: string;
    code: string;
    name: string;
    description: string;
    enabled: boolean;
    required: boolean;
    sortOrder: number;
    instructions: string;
    requiresVerification: boolean;
    createdAt: Date;
    updatedAt: Date;
    documents: StudentDocument[];
}
