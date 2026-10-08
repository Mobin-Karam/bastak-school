declare const states: readonly ["DRAFT", "PUBLISHED", "ARCHIVED"];
export declare class SaveEducationBookDto {
    id: string;
    country: string;
    schoolYear: string;
    grade: number;
    level: string;
    branch: string;
    track: string;
    category: string;
    titleFa: string;
    titleEn?: string;
    textbookCode?: string;
    appliesTo: string[];
    notes?: string;
    state?: (typeof states)[number];
    organizationId?: string | null;
}
export declare class UpdateEducationBookDto {
    country?: string;
    schoolYear?: string;
    grade?: number;
    level?: string;
    branch?: string;
    track?: string;
    category?: string;
    titleFa?: string;
    titleEn?: string;
    textbookCode?: string;
    appliesTo?: string[];
    notes?: string;
    state?: (typeof states)[number];
    organizationId?: string | null;
}
export declare class ImportEducationBooksDto {
    books: SaveEducationBookDto[];
}
export {};
