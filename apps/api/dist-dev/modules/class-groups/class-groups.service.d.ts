import { Repository } from "typeorm";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { Student } from "../../database/entities/student.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { CreateClassGroupDto, UpdateClassGroupDto } from "./class-groups.dto";
export declare class ClassGroupsService {
    private readonly classes;
    private readonly enrollments;
    private readonly groups;
    private readonly memberships;
    private readonly students;
    private readonly access;
    constructor(classes: Repository<EducationClass>, enrollments: Repository<EducationClassEnrollment>, groups: Repository<StudyGroup>, memberships: Repository<StudyGroupMembership>, students: Repository<Student>, access: SchoolAccessService);
    classOptions(user: AuthenticatedUser, organizationId?: string): Promise<{
        id: string;
        code: string;
        name: string;
        status: "ARCHIVED" | "ACTIVE";
        organizationId: string;
        organizationName: string;
        enrollmentCount: number;
    }[]>;
    eligibleStudents(user: AuthenticatedUser, classId: string): Promise<{
        id: string;
        name: string;
        grade: string;
        major: string;
    }[]>;
    list(user: AuthenticatedUser, classId?: string, organizationId?: string): Promise<ClassGroupSummary[]>;
    create(user: AuthenticatedUser, dto: CreateClassGroupDto): Promise<ClassGroupSummary>;
    update(user: AuthenticatedUser, id: string, dto: UpdateClassGroupDto): Promise<ClassGroupSummary>;
    members(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        name: string;
        nationalCode: string | null;
        userId: string | null;
    }[]>;
    setMembers(user: AuthenticatedUser, id: string, studentIds: string[]): Promise<{
        groupId: string;
        count: number;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        deleted: boolean;
    }>;
    private requireGroup;
    private requireCapability;
    private assertWorkOrganization;
    private canReadGroup;
    private assertMutable;
    private validateIdentity;
    private rethrowCodeConflict;
    private view;
}
