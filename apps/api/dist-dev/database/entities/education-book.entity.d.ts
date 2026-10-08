export declare class EducationBook {
    id: string;
    country: string;
    schoolYear: string;
    grade: number;
    level: string;
    branch: string;
    track: string;
    category: string;
    titleFa: string;
    titleEn: string;
    textbookCode?: string | null;
    appliesTo: string[];
    notes?: string | null;
    organizationId?: string | null;
    state: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    version: number;
    publishedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
