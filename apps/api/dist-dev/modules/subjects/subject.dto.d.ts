export declare class CreateSubjectDto {
    code: string;
    name: string;
    category?: string;
    organizationId?: string;
}
export declare class UpdateSubjectDto {
    name?: string;
    category?: string;
}
export declare class ImportSubjectsDto {
    subjects: Array<CreateSubjectDto>;
}
export declare class ArchiveSubjectDto {
    active: boolean;
}
export declare class UpdateStudentSubjectDto {
    enabled?: boolean;
    displayName?: string;
    weeklyTargetMinutes?: number;
}
export declare class AssignTeacherSubjectDto {
    teacherId: string;
    organizationId: string;
}
