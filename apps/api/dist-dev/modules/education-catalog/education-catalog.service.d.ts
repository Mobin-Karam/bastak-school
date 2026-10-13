import { EntityManager, Repository } from "typeorm";
import { EducationBook } from "../../database/entities/education-book.entity";
import { Student } from "../../database/entities/student.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Plan } from "../../database/entities/plan.entity";
import { LearningResourceAssignment } from "../../database/entities/learning-resource-assignment.entity";
import { ExamAttempt } from "../../database/entities/exam-attempt.entity";
import { DailyReport } from "../../database/entities/daily-report.entity";
import { AuthenticatedUser } from "../auth";
import { SaveEducationBookDto, UpdateEducationBookDto } from "./education-catalog.dto";
import type { EducationTaxonomy, TextbookDataset } from "./education-catalog.types";
export declare class EducationCatalogService {
    private readonly books;
    private readonly students;
    private readonly audit;
    private readonly memberships;
    private readonly plans?;
    private readonly resources?;
    private readonly attempts?;
    private readonly reports?;
    constructor(books: Repository<EducationBook>, students: Repository<Student>, audit: Repository<AuditLog>, memberships: Repository<OrganizationMembership>, plans?: Repository<Plan> | undefined, resources?: Repository<LearningResourceAssignment> | undefined, attempts?: Repository<ExamAttempt> | undefined, reports?: Repository<DailyReport> | undefined);
    signupOptions(): {
        schoolYear: unknown;
        grades: import("./education-catalog.types").GradeOption[];
        levels: import("./education-catalog.types").CatalogLabel[];
        educationTypes: import("./education-catalog.types").EducationType[];
        theoreticalTracks: import("./education-catalog.types").TrackOption[];
        vocationalGroups: import("./education-catalog.types").TrackOption[];
        vocationalFields: import("./education-catalog.types").TrackOption[];
        gradeStructure: import("./education-catalog.types").GradeStructure[];
    };
    validateSelection(grade: number, educationTypeId: string, trackId?: string): {
        gradeId: number;
        gradeLabel: string;
        educationTypeId: string;
        trackId: string;
        trackLabel: string;
    };
    listBooks(grade?: number, educationTypeId?: string, trackId?: string, organizationIds?: string[]): Promise<EducationBook[]>;
    booksForStudentUser(userId: string): Promise<{
        schoolYear: unknown;
        education: {
            gradeId: number;
            gradeLabel: string;
            educationTypeId: string;
            trackId: string;
            trackLabel: string;
        };
        books: EducationBook[];
    }>;
    datasets(): {
        taxonomy: EducationTaxonomy;
        textbooks: TextbookDataset;
    };
    listManaged(actor: AuthenticatedUser, schoolYear?: string, state?: string): Promise<EducationBook[]>;
    createBook(actor: AuthenticatedUser, input: SaveEducationBookDto): Promise<EducationBook>;
    previewImport(actor: AuthenticatedUser, inputs: SaveEducationBookDto[]): Promise<{
        valid: boolean;
        accepted: number;
        rejected: number;
        rows: {
            row: number;
            id: string | null;
            valid: boolean;
            errors: string[];
        }[];
    }>;
    commitImport(actor: AuthenticatedUser, inputs: SaveEducationBookDto[]): Promise<{
        imported: number;
        state: string;
        books: EducationBook[];
    }>;
    exportBooks(actor: AuthenticatedUser): Promise<{
        id: string;
        schoolYear: string;
        titleFa: string;
        titleEn: string;
        category: string;
        textbookCode: string;
        notes: string;
        organizationId: string;
    }[]>;
    updateBook(actor: AuthenticatedUser, id: string, input: UpdateEducationBookDto): Promise<EducationBook>;
    private archiveBook;
    publishBook(actor: AuthenticatedUser, id: string): Promise<EducationBook>;
    bookImpact(actor: AuthenticatedUser, id: string): Promise<{
        bookId: string;
        affectedStudents: number;
        sample: {
            id: string;
            name: string;
            grade: number;
        }[];
    }>;
    operationsOverview(actor: AuthenticatedUser, from?: string, to?: string, grade?: number): Promise<{
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
    }>;
    private scopedStudents;
    private cleanBook;
    private normalizePeriod;
    private record;
    private applyOrganizationOverrides;
    private bookMatchesSelection;
    private isPlatform;
    private requireOrganizationScope;
    private organizationIdsForUser;
    seed(): Promise<number>;
}
export declare function seedEducationCatalog(manager: EntityManager): Promise<number>;
