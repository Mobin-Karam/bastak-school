import { Repository } from "typeorm";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { Student } from "../../database/entities/student.entity";
import { StudentSubject } from "../../database/entities/student-subject.entity";
import { Subject } from "../../database/entities/subject.entity";
import { TeacherSubjectAssignment } from "../../database/entities/teacher-subject-assignment.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { User } from "../../database/entities/user.entity";
import { AuthorizationService } from "../authorization";
import { AuthenticatedUser } from "../auth";
import { AssignTeacherSubjectDto, CreateSubjectDto, UpdateStudentSubjectDto, UpdateSubjectDto } from "./subject.dto";
export declare class SubjectsService {
    private subjects;
    private settings;
    private students;
    private organizations;
    private teacherSubjects;
    private memberships;
    private roleAssignments;
    private users;
    private authorization;
    constructor(subjects: Repository<Subject>, settings: Repository<StudentSubject>, students: Repository<Student>, organizations: Repository<Organization>, teacherSubjects: Repository<TeacherSubjectAssignment>, memberships: Repository<OrganizationMembership>, roleAssignments: Repository<UserRoleAssignment>, users: Repository<User>, authorization: AuthorizationService);
    private context;
    list(u: AuthenticatedUser, includeArchived?: boolean): Promise<Subject[]>;
    create(u: AuthenticatedUser, d: CreateSubjectDto): Promise<Subject>;
    update(u: AuthenticatedUser, id: string, d: UpdateSubjectDto): Promise<Subject>;
    export(u: AuthenticatedUser): Promise<{
        schemaVersion: string;
        subjects: {
            code: string;
            name: string;
            category: string;
            active: boolean;
            organizationId: string | undefined;
        }[];
    }>;
    importSample(): {
        schemaVersion: string;
        subjects: {
            code: string;
            name: string;
            category: string;
        }[];
    };
    previewImport(u: AuthenticatedUser, rows?: CreateSubjectDto[]): Promise<{
        valid: boolean;
        accepted: number;
        rejected: number;
        rows: {
            row: number;
            code: string | null;
            valid: boolean;
            errors: string[];
        }[];
    }>;
    commitImport(u: AuthenticatedUser, rows?: CreateSubjectDto[]): Promise<{
        imported: number;
        subjects: Subject[];
    }>;
    setActive(u: AuthenticatedUser, id: string, active: boolean): Promise<Subject>;
    private accessibleSubject;
    assignTeacher(u: AuthenticatedUser, subjectId: string, d: AssignTeacherSubjectDto): Promise<TeacherSubjectAssignment>;
    listTeachers(u: AuthenticatedUser, subjectId: string, organizationId: string): Promise<{
        id: string;
        teacher: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        createdAt: Date;
    }[]>;
    unassignTeacher(u: AuthenticatedUser, subjectId: string, teacherId: string, organizationId: string): Promise<{
        removed: boolean;
    }>;
    forStudent(u: AuthenticatedUser, studentId: string): Promise<{
        subject: {
            id: string;
            code: string;
            name: string;
            category: string;
        };
        enabled: boolean;
        displayName: string;
        weeklyTargetMinutes: number;
    }[]>;
    configure(u: AuthenticatedUser, studentId: string, subjectId: string, d: UpdateStudentSubjectDto): Promise<StudentSubject>;
}
