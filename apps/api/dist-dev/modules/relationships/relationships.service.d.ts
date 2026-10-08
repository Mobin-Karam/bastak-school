import { Repository } from "typeorm";
import { Organization } from "../../database/entities/organization.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Student } from "../../database/entities/student.entity";
import { RelationshipStatus, RelationshipType, UserRelationship } from "../../database/entities/user-relationship.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { NotificationsService } from "../notifications";
import { CreateRelationshipDto, UpdateRelationshipDto } from "./dto/relationship.dto";
export declare class RelationshipsService {
    private relationships;
    private users;
    private students;
    private organizations;
    private memberships;
    private assignments;
    private notifications;
    constructor(relationships: Repository<UserRelationship>, users: Repository<User>, students: Repository<Student>, organizations: Repository<Organization>, memberships: Repository<OrganizationMembership>, assignments: Repository<UserRoleAssignment>, notifications: NotificationsService);
    private platform;
    private canManage;
    list(user: AuthenticatedUser): Promise<{
        id: string;
        type: RelationshipType;
        status: RelationshipStatus;
        fromUser: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        student: {
            id: string;
            name: string;
        } | undefined;
        organizationId: string | null;
        createdAt: Date;
        acceptedAt: Date | null | undefined;
        revokedAt: Date | null | undefined;
    }[]>;
    get(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        type: RelationshipType;
        status: RelationshipStatus;
        fromUser: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        student: {
            id: string;
            name: string;
        } | undefined;
        organizationId: string | null;
        createdAt: Date;
        acceptedAt: Date | null | undefined;
        revokedAt: Date | null | undefined;
    }>;
    create(user: AuthenticatedUser, dto: CreateRelationshipDto): Promise<{
        id: string;
        type: RelationshipType;
        status: RelationshipStatus;
        fromUser: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        student: {
            id: string;
            name: string;
        } | undefined;
        organizationId: string | null;
        createdAt: Date;
        acceptedAt: Date | null | undefined;
        revokedAt: Date | null | undefined;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateRelationshipDto): Promise<{
        id: string;
        type: RelationshipType;
        status: RelationshipStatus;
        fromUser: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        student: {
            id: string;
            name: string;
        } | undefined;
        organizationId: string | null;
        createdAt: Date;
        acceptedAt: Date | null | undefined;
        revokedAt: Date | null | undefined;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        type: RelationshipType;
        status: RelationshipStatus;
        fromUser: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        student: {
            id: string;
            name: string;
        } | undefined;
        organizationId: string | null;
        createdAt: Date;
        acceptedAt: Date | null | undefined;
        revokedAt: Date | null | undefined;
    }>;
    forStudent(user: AuthenticatedUser, studentId: string): Promise<{
        id: string;
        type: RelationshipType;
        status: RelationshipStatus;
        fromUser: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        student: {
            id: string;
            name: string;
        } | undefined;
        organizationId: string | null;
        createdAt: Date;
        acceptedAt: Date | null | undefined;
        revokedAt: Date | null | undefined;
    }[]>;
    myStudents(user: AuthenticatedUser): Promise<{
        student: {
            id: string;
            name: string;
        };
        relationship: {
            type: string;
            status: string;
        };
    }[]>;
    guardianSelection(user: AuthenticatedUser): Promise<{
        relationships: {
            id: string;
            type: RelationshipType;
            status: RelationshipStatus;
            fromUser: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            };
            student: {
                id: string;
                name: string;
            } | undefined;
            organizationId: string | null;
            createdAt: Date;
            acceptedAt: Date | null | undefined;
            revokedAt: Date | null | undefined;
        }[];
        change: {
            allowed: boolean;
            nextAllowedAt: Date | null;
        };
    }>;
    guardianCandidates(user: AuthenticatedUser, search?: string): Promise<{
        id: string;
        username: string;
        name: string;
        organization: {
            id: string;
            name: string;
        } | null;
    }[]>;
    requestGuardian(user: AuthenticatedUser, guardianUserId: string): Promise<{
        id: string;
        type: RelationshipType;
        status: RelationshipStatus;
        fromUser: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        };
        student: {
            id: string;
            name: string;
        } | undefined;
        organizationId: string | null;
        createdAt: Date;
        acceptedAt: Date | null | undefined;
        revokedAt: Date | null | undefined;
    }>;
    cancelGuardianRequest(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        cancelled: boolean;
    }>;
    allowGuardianChange(user: AuthenticatedUser, studentId: string): Promise<{
        studentId: string;
        guardianChangeAllowed: boolean;
    }>;
    private selfStudent;
    private project;
}
