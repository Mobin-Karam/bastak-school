export declare const SCHOOL_YEAR_PATTERN: RegExp;
export declare class SaveEducationClassDto {
    organizationId: string;
    code: string;
    name: string;
    schoolYear: string;
    capacity?: number;
}
export declare class UpdateEducationClassDto {
    code?: string;
    name?: string;
    schoolYear?: string;
    capacity?: number;
    description?: string;
    advisorId?: string | null;
    status?: "ACTIVE" | "ARCHIVED";
}
export declare class SetClassBooksDto {
    books: Array<{
        bookId: string;
        teacherId: string;
    }>;
}
export declare class SetClassEnrollmentsDto {
    studentIds: string[];
}
export declare class ClassTransferRowDto {
    code: string;
    name: string;
    schoolYear: string;
    capacity?: number;
}
export declare class ClassTransferDto {
    organizationId: string;
    rows: ClassTransferRowDto[];
}
