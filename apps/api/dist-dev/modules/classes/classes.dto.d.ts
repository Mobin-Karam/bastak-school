export declare class SaveEducationClassDto {
    organizationId: string;
    code: string;
    name: string;
    schoolYear: string;
    gradeId: number;
    educationTypeId: string;
    trackId: string;
    capacity?: number;
    description?: string;
    advisorId?: string | null;
}
export declare class UpdateEducationClassDto {
    code?: string;
    name?: string;
    schoolYear?: string;
    gradeId?: number;
    educationTypeId?: string;
    trackId?: string;
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
