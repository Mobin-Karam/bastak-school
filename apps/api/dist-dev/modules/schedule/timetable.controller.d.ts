import { AuthenticatedUser } from "../auth";
import { TimetableService } from "./timetable.service";
import { TimetableQueryDto, TimetablePageDto, TimetableBulkDto, TimetableAttendanceDto, TimetableConfigDto, TimetableImportDto, TimetableLessonWriteDto, TimetableOverrideDto, TimetablePublishDto, TimetableRevisionDto, TimetableVersionDto } from "./timetable.dto";
export declare class TimetableController {
    private readonly timetable;
    constructor(timetable: TimetableService);
    workspace(user: AuthenticatedUser, org: string, versionId?: string, startsOn?: string): Promise<{
        ok: boolean;
        data: TimetableWorkspace;
    }>;
    versions(u: AuthenticatedUser, org: string, query: TimetableQueryDto): Promise<{
        ok: boolean;
        data: {
            items: VersionContract[];
            total: number;
            offset: number;
            limit: number;
        };
    }>;
    occurrences(u: AuthenticatedUser, org: string, query: TimetableQueryDto): Promise<{
        ok: boolean;
        data: {
            items: any;
            total: any;
            offset: number;
            limit: number;
        };
    }>;
    conflicts(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            revision: number;
            conflicts: TimetableConflict[];
        };
    }>;
    history(u: AuthenticatedUser, id: string, page: TimetablePageDto): Promise<{
        ok: boolean;
        data: {
            items: {
                createdAt: string;
                id: string;
                versionId: string;
                version?: object;
                lessonId: string | null;
                lesson?: object;
                action: string;
                reason: string;
                actorId: string;
                actor?: object;
                actorName: string;
                beforeText: string;
                afterText: string;
            }[];
            total: number;
            offset: number;
            limit: number;
        };
    }>;
    archive(u: AuthenticatedUser, id: string, dto: TimetablePublishDto): Promise<{
        ok: boolean;
        data: VersionContract;
    }>;
    bulkPreview(u: AuthenticatedUser, id: string, dto: TimetableBulkDto): Promise<{
        ok: boolean;
        data: {
            valid: boolean;
            conflicts: TimetableConflict[];
            revision: number;
            ids?: undefined;
        } | {
            ids: string[];
            revision: number;
            valid?: undefined;
            conflicts?: undefined;
        };
    }>;
    bulk(u: AuthenticatedUser, id: string, dto: TimetableBulkDto): Promise<{
        ok: boolean;
        data: {
            valid: boolean;
            conflicts: TimetableConflict[];
            revision: number;
            ids?: undefined;
        } | {
            ids: string[];
            revision: number;
            valid?: undefined;
            conflicts?: undefined;
        };
    }>;
    config(user: AuthenticatedUser, org: string, dto: TimetableConfigDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").EducationClass | import("../../database/entities").TimetableAcademicYear | import("../../database/entities").TimetableTerm | import("../../database/entities").TimetableSection | import("../../database/entities").TimetableLocation | import("../../database/entities").TimetableBellSchedule | import("../../database/entities").TimetableDailySession | import("../../database/entities").TimetablePeriod | import("../../database/entities").TimetableHoliday | import("../../database/entities").TimetableTeacherAvailability | import("../../database/entities").TimetableAllocation;
    }>;
    create(user: AuthenticatedUser, org: string, dto: TimetableVersionDto): Promise<{
        ok: boolean;
        data: VersionContract;
    }>;
    lesson(user: AuthenticatedUser, id: string, dto: TimetableLessonWriteDto): Promise<{
        ok: boolean;
        data: {
            conflicts: TimetableConflict[];
            id?: undefined;
            revision?: undefined;
        } | {
            id: string;
            revision: number;
            conflicts?: undefined;
        };
    }>;
    preview(user: AuthenticatedUser, id: string, dto: TimetableLessonWriteDto): Promise<{
        ok: boolean;
        data: {
            conflicts: TimetableConflict[];
            id?: undefined;
            revision?: undefined;
        } | {
            id: string;
            revision: number;
            conflicts?: undefined;
        };
    }>;
    update(user: AuthenticatedUser, id: string, lessonId: string, dto: TimetableLessonWriteDto): Promise<{
        ok: boolean;
        data: {
            conflicts: TimetableConflict[];
            id?: undefined;
            revision?: undefined;
        } | {
            id: string;
            revision: number;
            conflicts?: undefined;
        };
    }>;
    previewUpdate(user: AuthenticatedUser, id: string, lessonId: string, dto: TimetableLessonWriteDto): Promise<{
        ok: boolean;
        data: {
            conflicts: TimetableConflict[];
            id?: undefined;
            revision?: undefined;
        } | {
            id: string;
            revision: number;
            conflicts?: undefined;
        };
    }>;
    remove(user: AuthenticatedUser, id: string, lessonId: string, dto: TimetableRevisionDto): Promise<{
        ok: boolean;
        data: {
            revision: number;
        };
    }>;
    publish(user: AuthenticatedUser, id: string, dto: TimetablePublishDto): Promise<{
        ok: boolean;
        data: VersionContract;
    }>;
    override(user: AuthenticatedUser, id: string, dto: TimetableOverrideDto): Promise<{
        ok: boolean;
        data: {
            createdAt: string;
            id: string;
            versionId: string;
            version?: object;
            lessonId: string;
            lesson?: object;
            date: string;
            cancelled: boolean;
            teacherId: string | null;
            teacher?: object;
            locationId: string | null;
            location?: object;
            startTime: string | null;
            endTime: string | null;
            reason: string;
            changedById: string;
            changedBy?: object;
            changedByName: string;
        };
    }>;
    previewImport(user: AuthenticatedUser, id: string, dto: TimetableImportDto): Promise<{
        ok: boolean;
        data: {
            valid: boolean;
            revision: number;
            rows: {
                row: number;
                source: string;
                errors: string[];
            }[];
            conflicts: TimetableConflict[];
        };
    }>;
    import(user: AuthenticatedUser, id: string, dto: TimetableImportDto): Promise<{
        ok: boolean;
        data: {
            imported: number;
            revision: number;
        };
    }>;
    attendance(user: AuthenticatedUser, id: string, dto: TimetableAttendanceDto): Promise<{
        ok: boolean;
        data: {
            sessionId: string;
            cancelled: any;
        };
    }>;
}
