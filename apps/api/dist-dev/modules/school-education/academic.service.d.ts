import { DataSource } from "typeorm";
import { TeachingAssignment, SubjectBookReference } from "../../database/entities/academic-structure.entity";
import { Subject } from "../../database/entities/subject.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { AcademicPageDto, AcademicSubjectDto, TeachingAssignmentDto, SubjectBookReferenceDto, EndTeachingAssignmentDto } from "./academic.dto";
export declare class AcademicService {
    private readonly db;
    private readonly access;
    constructor(db: DataSource, access: SchoolAccessService);
    private fail;
    private school;
    private subject;
    subjects(user: AuthenticatedUser, org: string, page: AcademicPageDto): Promise<{
        items: Subject[];
        total: number;
        offset: number;
        limit: number;
    }>;
    createSubject(user: AuthenticatedUser, org: string, dto: AcademicSubjectDto): Promise<Subject>;
    teachers(user: AuthenticatedUser, org: string, page: AcademicPageDto): Promise<{
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
    }>;
    assignments(user: AuthenticatedUser, org: string, page: AcademicPageDto): Promise<{
        items: TeachingAssignment[];
        total: number;
        offset: number;
        limit: number;
    }>;
    createAssignment(user: AuthenticatedUser, org: string, dto: TeachingAssignmentDto): Promise<TeachingAssignment>;
    endAssignment(user: AuthenticatedUser, org: string, id: string, dto: EndTeachingAssignmentDto): Promise<TeachingAssignment>;
    reference(user: AuthenticatedUser, org: string, dto: SubjectBookReferenceDto): Promise<SubjectBookReference>;
    references(user: AuthenticatedUser, org: string, page: AcademicPageDto): Promise<{
        items: SubjectBookReference[];
        total: number;
        offset: number;
        limit: number;
    }>;
    private audit;
}
