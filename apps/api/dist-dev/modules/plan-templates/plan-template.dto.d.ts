export declare class CreatePlanTemplateDto {
    organizationId: string;
    title: string;
    description?: string;
    tags?: string[];
    days?: unknown[];
}
export declare class PreviewPlanTemplateApplyDto {
    targetStudentIds: string[];
    targetStartDate: string;
}
export declare class ApplyPlanTemplateDto extends PreviewPlanTemplateApplyDto {
    replaceExisting?: boolean;
}
