import { AuthenticatedUser } from "../auth";
import { AcademicService } from "./academic.service";
import { AcademicPageDto, AcademicSubjectDto, TeachingAssignmentDto, SubjectBookReferenceDto, EndTeachingAssignmentDto } from "./academic.dto";
export declare class AcademicController {
    private readonly academic;
    constructor(academic: AcademicService);
    subjects(u: AuthenticatedUser, org: string, page: AcademicPageDto): Promise<{
        ok: boolean;
        data: {
            items: import("../../database/entities").Subject[];
            total: number;
            offset: number;
            limit: number;
        };
    }>;
    createSubject(u: AuthenticatedUser, org: string, dto: AcademicSubjectDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Subject;
    }>;
    teachers(u: AuthenticatedUser, org: string, page: AcademicPageDto): Promise<{
        ok: boolean;
        data: {
            items: {
                id: string;
                firstName: string;
                lastName: string;
                username: string;
                membershipId: string | undefined;
            }[];
            total: number;
            offset: number;
            limit: number;
        };
    }>;
    assignments(u: AuthenticatedUser, org: string, page: AcademicPageDto): Promise<{
        ok: boolean;
        data: {
            items: import("../../database/entities").TeachingAssignment[];
            total: number;
            offset: number;
            limit: number;
        };
    }>;
    create(u: AuthenticatedUser, org: string, dto: TeachingAssignmentDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").TeachingAssignment;
    }>;
    end(u: AuthenticatedUser, org: string, id: string, dto: EndTeachingAssignmentDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").TeachingAssignment;
    }>;
    references(u: AuthenticatedUser, org: string, page: AcademicPageDto): Promise<{
        ok: boolean;
        data: {
            items: import("../../database/entities").SubjectBookReference[];
            total: number;
            offset: number;
            limit: number;
        };
    }>;
    reference(u: AuthenticatedUser, org: string, dto: SubjectBookReferenceDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").SubjectBookReference;
    }>;
}
