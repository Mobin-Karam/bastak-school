import { Repository } from "typeorm";
import { EducationClass } from "../../database/entities/education-class.entity";
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
    private readonly authorization;
    constructor(entries: Repository<SchoolScheduleEntry>, organizations: Repository<Organization>, memberships: Repository<OrganizationMembership>, classes: Repository<EducationClass>, authorization: AuthorizationService);
    private context;
    private isOperator;
    list(user: AuthenticatedUser, organizationId?: string): Promise<SchoolScheduleEntry[]>;
    export(user: AuthenticatedUser, organizationId?: string): Promise<SchoolScheduleEntry[]>;
    create(user: AuthenticatedUser, dto: SaveScheduleEntryDto): Promise<SchoolScheduleEntry>;
    update(user: AuthenticatedUser, id: string, dto: SaveScheduleEntryDto): Promise<SchoolScheduleEntry>;
    archive(user: AuthenticatedUser, id: string, dto: ArchiveScheduleEntryDto): Promise<SchoolScheduleEntry>;
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
        entries: SchoolScheduleEntry[];
    }>;
    private importErrors;
    private classroomForOrganization;
    private teacherForOrganization;
}
