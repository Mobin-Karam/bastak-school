export declare class StudentImportRowDto {
    firstName: string;
    lastName: string;
    nationalCode?: string;
    gradeId?: number;
    educationTypeId?: string;
    trackId?: string;
}
export declare class PreviewStudentImportDto {
    organizationId: string;
    rows: StudentImportRowDto[];
}
export declare class CommitStudentImportDto extends PreviewStudentImportDto {
}
