import { Repository } from "typeorm";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassBook } from "../../database/entities/education-class-book.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { SchoolScheduleEntry } from "../../database/entities/school-schedule-entry.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService } from "../authorization";
import { ArchiveScheduleEntryDto, SaveScheduleEntryDto } from "./schedule.dto";
export declare class ScheduleService {
    private readonly entries;
    private readonly organizations;
    private readonly memberships;
    private readonly classes;
    private readonly classBooks;
    private readonly authorization;
    constructor(entries: Repository<SchoolScheduleEntry>, organizations: Repository<Organization>, memberships: Repository<OrganizationMembership>, classes: Repository<EducationClass>, classBooks: Repository<EducationClassBook>, authorization: AuthorizationService);
    private context;
    private isOperator;
    list(user: AuthenticatedUser, organizationId?: string): Promise<{
        teacher: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        } | null;
        classBook: {
            teacher: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            } | null;
            id: string;
            classroom: EducationClass;
            book: import("../../database/entities").EducationBook;
            createdAt: Date;
        } | null;
        id: string;
        organization: Organization;
        classroom?: EducationClass | null;
        title: string;
        weekday: number;
        startTime: string;
        endTime: string;
        room: string;
        status: "ACTIVE" | "ARCHIVED";
        versionId: string | null;
        version?: object;
        periodId: string | null;
        period?: object;
        locationId: string | null;
        location?: object;
        startsOn: string | null;
        endsOn: string | null;
        notes: string;
        classroomNameSnapshot: string;
        teacherNameSnapshot: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    private listEntities;
    export(user: AuthenticatedUser, organizationId?: string): Promise<{
        teacher: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        } | null;
        classBook: {
            teacher: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            } | null;
            id: string;
            classroom: EducationClass;
            book: import("../../database/entities").EducationBook;
            createdAt: Date;
        } | null;
        id: string;
        organization: Organization;
        classroom?: EducationClass | null;
        title: string;
        weekday: number;
        startTime: string;
        endTime: string;
        room: string;
        status: "ACTIVE" | "ARCHIVED";
        versionId: string | null;
        version?: object;
        periodId: string | null;
        period?: object;
        locationId: string | null;
        location?: object;
        startsOn: string | null;
        endsOn: string | null;
        notes: string;
        classroomNameSnapshot: string;
        teacherNameSnapshot: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(user: AuthenticatedUser, dto: SaveScheduleEntryDto): Promise<{
        teacher: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        } | null;
        classBook: {
            teacher: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            } | null;
            id: string;
            classroom: EducationClass;
            book: import("../../database/entities").EducationBook;
            createdAt: Date;
        } | null;
        id: string;
        organization: Organization;
        classroom?: EducationClass | null;
        title: string;
        weekday: number;
        startTime: string;
        endTime: string;
        room: string;
        status: "ACTIVE" | "ARCHIVED";
        versionId: string | null;
        version?: object;
        periodId: string | null;
        period?: object;
        locationId: string | null;
        location?: object;
        startsOn: string | null;
        endsOn: string | null;
        notes: string;
        classroomNameSnapshot: string;
        teacherNameSnapshot: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthenticatedUser, id: string, dto: SaveScheduleEntryDto): Promise<{
        teacher: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        } | null;
        classBook: {
            teacher: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            } | null;
            id: string;
            classroom: EducationClass;
            book: import("../../database/entities").EducationBook;
            createdAt: Date;
        } | null;
        id: string;
        organization: Organization;
        classroom?: EducationClass | null;
        title: string;
        weekday: number;
        startTime: string;
        endTime: string;
        room: string;
        status: "ACTIVE" | "ARCHIVED";
        versionId: string | null;
        version?: object;
        periodId: string | null;
        period?: object;
        locationId: string | null;
        location?: object;
        startsOn: string | null;
        endsOn: string | null;
        notes: string;
        classroomNameSnapshot: string;
        teacherNameSnapshot: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    archive(user: AuthenticatedUser, id: string, dto: ArchiveScheduleEntryDto): Promise<{
        teacher: {
            id: string;
            username: string;
            firstName: string;
            lastName: string;
        } | null;
        classBook: {
            teacher: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            } | null;
            id: string;
            classroom: EducationClass;
            book: import("../../database/entities").EducationBook;
            createdAt: Date;
        } | null;
        id: string;
        organization: Organization;
        classroom?: EducationClass | null;
        title: string;
        weekday: number;
        startTime: string;
        endTime: string;
        room: string;
        status: "ACTIVE" | "ARCHIVED";
        versionId: string | null;
        version?: object;
        periodId: string | null;
        period?: object;
        locationId: string | null;
        location?: object;
        startsOn: string | null;
        endsOn: string | null;
        notes: string;
        classroomNameSnapshot: string;
        teacherNameSnapshot: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        deleted: boolean;
    }>;
    previewImport(user: AuthenticatedUser, entries: SaveScheduleEntryDto[]): Promise<{
        valid: boolean;
        errors: {
            row: number;
            message: string;
        }[];
        summary: {
            rows: number;
            valid: number;
        };
    }>;
    commitImport(user: AuthenticatedUser, entries: SaveScheduleEntryDto[]): Promise<{
        imported: number;
        entries: {
            teacher: {
                id: string;
                username: string;
                firstName: string;
                lastName: string;
            } | null;
            classBook: {
                teacher: {
                    id: string;
                    username: string;
                    firstName: string;
                    lastName: string;
                } | null;
                id: string;
                classroom: EducationClass;
                book: import("../../database/entities").EducationBook;
                createdAt: Date;
            } | null;
            id: string;
            organization: Organization;
            classroom?: EducationClass | null;
            title: string;
            weekday: number;
            startTime: string;
            endTime: string;
            room: string;
            status: "ACTIVE" | "ARCHIVED";
            versionId: string | null;
            version?: object;
            periodId: string | null;
            period?: object;
            locationId: string | null;
            location?: object;
            startsOn: string | null;
            endsOn: string | null;
            notes: string;
            classroomNameSnapshot: string;
            teacherNameSnapshot: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    private importErrors;
    private classroomForOrganization;
    private publicEntry;
    private teacherForOrganization;
    private classBookForSession;
}
