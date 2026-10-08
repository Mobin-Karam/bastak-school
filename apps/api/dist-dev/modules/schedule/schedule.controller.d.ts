import { AuthenticatedUser } from "../auth";
import { ArchiveScheduleEntryDto, SaveScheduleEntryDto } from "./schedule.dto";
import { ScheduleService } from "./schedule.service";
export declare class ScheduleController {
    private readonly schedule;
    constructor(schedule: ScheduleService);
    list(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").SchoolScheduleEntry[];
    }>;
    export(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").SchoolScheduleEntry[];
    }>;
    create(user: AuthenticatedUser, dto: SaveScheduleEntryDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").SchoolScheduleEntry;
    }>;
    preview(user: AuthenticatedUser, entries: SaveScheduleEntryDto[]): Promise<{
        ok: boolean;
        data: {
            valid: boolean;
            errors: {
                row: number;
                message: string;
            }[];
            summary: {
                rows: number;
                valid: number;
            };
        };
    }>;
    commit(user: AuthenticatedUser, entries: SaveScheduleEntryDto[]): Promise<{
        ok: boolean;
        data: {
            imported: number;
            entries: import("../../database/entities").SchoolScheduleEntry[];
        };
    }>;
    update(user: AuthenticatedUser, id: string, dto: SaveScheduleEntryDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").SchoolScheduleEntry;
    }>;
    archive(user: AuthenticatedUser, id: string, dto: ArchiveScheduleEntryDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").SchoolScheduleEntry;
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
