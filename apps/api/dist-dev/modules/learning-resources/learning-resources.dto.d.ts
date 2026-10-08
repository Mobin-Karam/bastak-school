export declare class SaveLearningResourceDto {
    title: string;
    description?: string;
    type: "LINK" | "VIDEO";
    category?: string;
    url: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    studentIds: string[];
}
