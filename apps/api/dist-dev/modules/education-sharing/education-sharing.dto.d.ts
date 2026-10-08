export declare class ShareEducationDto {
    targetStudentId: string;
    date?: string;
}
export declare class SharePlanRangeDto {
    targetStudentIds: string[];
    sourceFrom?: string;
    sourceTo?: string;
    targetStartDate?: string;
    conflictPolicy?: "skip" | "overwrite";
}
