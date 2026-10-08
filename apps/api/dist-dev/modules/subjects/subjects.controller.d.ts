import { AuthenticatedUser } from "../auth";
import { AssignTeacherSubjectDto, ArchiveSubjectDto, CreateSubjectDto, ImportSubjectsDto, UpdateStudentSubjectDto, UpdateSubjectDto } from "./subject.dto";
import { SubjectsService } from "./subjects.service";
export declare class SubjectsController {
    private service;
    constructor(service: SubjectsService);
    list(u: AuthenticatedUser, includeArchived?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").Subject[];
    }>;
    create(u: AuthenticatedUser, d: CreateSubjectDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Subject;
    }>;
    export(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            schemaVersion: string;
            subjects: {
                code: string;
                name: string;
                category: string;
                active: boolean;
                organizationId: string | undefined;
            }[];
        };
    }>;
    sample(): {
        ok: boolean;
        data: {
            schemaVersion: string;
            subjects: {
                code: string;
                name: string;
                category: string;
            }[];
        };
    };
    previewImport(u: AuthenticatedUser, d: ImportSubjectsDto): Promise<{
        ok: boolean;
        data: {
            valid: boolean;
            accepted: number;
            rejected: number;
            rows: {
                row: number;
                code: string | null;
                valid: boolean;
                errors: string[];
            }[];
        };
    }>;
    commitImport(u: AuthenticatedUser, d: ImportSubjectsDto): Promise<{
        ok: boolean;
        data: {
            imported: number;
            subjects: import("../../database/entities").Subject[];
        };
    }>;
    update(u: AuthenticatedUser, id: string, d: UpdateSubjectDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Subject;
    }>;
    archive(u: AuthenticatedUser, id: string, d: ArchiveSubjectDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Subject;
    }>;
    assignTeacher(u: AuthenticatedUser, id: string, d: AssignTeacherSubjectDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").TeacherSubjectAssignment;
    }>;
    teachers(u: AuthenticatedUser, id: string, organizationId: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            teacher: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            createdAt: Date;
        }[];
    }>;
    unassignTeacher(u: AuthenticatedUser, id: string, teacherId: string, organizationId: string): Promise<{
        ok: boolean;
        data: {
            removed: boolean;
        };
    }>;
    forStudent(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            subject: {
                id: string;
                code: string;
                name: string;
                category: string;
            };
            enabled: boolean;
            displayName: string;
            weeklyTargetMinutes: number;
        }[];
    }>;
    configure(u: AuthenticatedUser, studentId: string, subjectId: string, d: UpdateStudentSubjectDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").StudentSubject;
    }>;
}
