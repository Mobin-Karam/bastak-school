import { Repository } from "typeorm";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { Student } from "../../database/entities/student.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access/school-access.service";
import { CreateClassGroupDto } from "./class-groups.dto";
export declare class ClassGroupsService {
    private readonly classes;
    private readonly enrollments;
    private readonly groups;
    private readonly memberships;
    private readonly students;
    private readonly access;
    constructor(classes: Repository<EducationClass>, enrollments: Repository<EducationClassEnrollment>, groups: Repository<StudyGroup>, memberships: Repository<StudyGroupMembership>, students: Repository<Student>, access: SchoolAccessService);
    list(user: AuthenticatedUser, classId?: string, organizationId?: string): Promise<{
        id: string;
        code: string;
        name: string;
        description: string;
        status: "ARCHIVED" | "ACTIVE";
        organizationId: string;
        classId: string | null;
        className: string | null;
        memberCount: number;
    }[]>;
    create(user: AuthenticatedUser, dto: CreateClassGroupDto): Promise<{
        id: string;
        code: string;
        name: string;
        description: string;
        status: "ARCHIVED" | "ACTIVE";
        organizationId: string;
        classId: string | null;
        className: string | null;
        memberCount: number;
    }>;
    members(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        name: string;
        nationalCode: string | null | undefined;
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
    private view;
}
