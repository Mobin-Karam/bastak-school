import { AuthenticatedUser } from "../auth";
import { EducationCatalogService } from "./education-catalog.service";
import { ImportEducationBooksDto, SaveEducationBookDto, UpdateEducationBookDto } from "./education-catalog.dto";
export declare class EducationCatalogController {
    private readonly catalog;
    constructor(catalog: EducationCatalogService);
    signupOptions(): {
        ok: boolean;
        data: {
            schoolYear: unknown;
            grades: import("./education-catalog.types").GradeOption[];
            levels: import("./education-catalog.types").CatalogLabel[];
            educationTypes: import("./education-catalog.types").EducationType[];
            theoreticalTracks: import("./education-catalog.types").TrackOption[];
            vocationalGroups: import("./education-catalog.types").TrackOption[];
            vocationalFields: import("./education-catalog.types").TrackOption[];
            gradeStructure: import("./education-catalog.types").GradeStructure[];
        };
    };
    books(grade?: string, educationTypeId?: string, trackId?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").EducationBook[];
    }>;
    myBooks(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            schoolYear: unknown;
            education: {
                gradeId: number;
                gradeLabel: string;
                educationTypeId: string;
                trackId: string;
                trackLabel: string;
            };
            books: import("../../database/entities").EducationBook[];
        };
    }>;
    datasets(): {
        ok: boolean;
        data: {
            taxonomy: import("./education-catalog.types").EducationTaxonomy;
            textbooks: import("./education-catalog.types").TextbookDataset;
        };
    };
    overview(user: AuthenticatedUser, from?: string, to?: string, grade?: string): Promise<{
        ok: boolean;
        data: {
            scope: string;
            period: {
                from: string;
                to: string;
            } | null;
            cohort: {
                grade: number;
            } | null;
            students: {
                total: number;
                complete: number;
                incomplete: number;
                missingMappings: number;
            };
            coverage: {
                planned: number;
                withoutPlan: number;
                resourced: number;
                withoutResources: number;
                examined: number;
                reported: number;
            };
            trends: {
                submittedAttempts: number;
                averageExamPercentage: number | null;
                totalStudyHours: number;
                averageStudyHours: number | null;
            };
            remediation: {
                incompleteProfiles: {
                    id: string;
                    name: string;
                    grade: number | null;
                    reason: string;
                }[];
                withoutPlan: {
                    id: string;
                    name: string;
                    grade: number | null;
                    reason: string;
                }[];
                withoutResources: {
                    id: string;
                    name: string;
                    grade: number | null;
                    reason: string;
                }[];
                withoutExam: {
                    id: string;
                    name: string;
                    grade: number | null;
                    reason: string;
                }[];
                withoutReport: {
                    id: string;
                    name: string;
                    grade: number | null;
                    reason: string;
                }[];
            };
            catalog: {
                published: number;
                draft: number;
                archived: number;
            };
            distribution: {
                label: string;
                count: number;
            }[];
        };
    }>;
    managedBooks(user: AuthenticatedUser, schoolYear?: string, state?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").EducationBook[];
    }>;
    impact(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            bookId: string;
            affectedStudents: number;
            sample: {
                id: string;
                name: string;
                grade: number;
            }[];
        };
    }>;
    createBook(user: AuthenticatedUser, dto: SaveEducationBookDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").EducationBook;
    }>;
    importPreview(user: AuthenticatedUser, dto: ImportEducationBooksDto): Promise<{
        ok: boolean;
        data: {
            valid: boolean;
            accepted: number;
            rejected: number;
            rows: {
                row: number;
                id: string | null;
                valid: boolean;
                errors: string[];
            }[];
        };
    }>;
    importCommit(user: AuthenticatedUser, dto: ImportEducationBooksDto): Promise<{
        ok: boolean;
        data: {
            imported: number;
            state: string;
            books: import("../../database/entities").EducationBook[];
        };
    }>;
    updateBook(user: AuthenticatedUser, id: string, dto: UpdateEducationBookDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").EducationBook;
    }>;
    publishBook(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").EducationBook;
    }>;
}
