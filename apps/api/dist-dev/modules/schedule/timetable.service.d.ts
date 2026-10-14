import { DataSource } from "typeorm";
import type { TimetableWorkspace, TimetableAttendanceReport, TimetableVersion as VersionContract } from "@moshaver/api-contract";
import { TimetableAcademicYear, TimetableTerm, TimetableSection, TimetableLocation, TimetableBellSchedule, TimetableDailySession, TimetablePeriod, TimetableHoliday, TimetableTeacherAvailability, TimetableAllocation } from "../../database/entities/timetable.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { AttendanceService } from "../attendance";
import { NotificationsService } from "../notifications";
import { TimetableQueryDto, TimetablePageDto, TimetableBulkDto, TimetableConfigDto, TimetableLessonWriteDto, TimetableVersionDto, TimetablePublishDto, TimetableOverrideDto, TimetableImportDto } from "./timetable.dto";
export declare class TimetableService {
    private readonly database;
    private readonly access;
    private readonly attendance;
    private readonly notifications;
    constructor(database: DataSource, access: SchoolAccessService, attendance: AttendanceService, notifications: NotificationsService);
    private fail;
    private capability;
    private school;
    private name;
    private person;
    private dates;
    private times;
    private term;
    private version;
    private revision;
    private audit;
    private versionView;
    private teacher;
    private lessonBatch;
    private validateLesson;
    private lessonViews;
    private versionData;
    private checkConflicts;
    private workspaceConflicts;
    conflicts(user: AuthenticatedUser, id: string): Promise<{
        revision: number;
        conflicts: import("@moshaver/api-contract").TimetableConflict[];
    }>;
    workspace(user: AuthenticatedUser, organizationId: string, versionId?: string, startsOn?: string, rangeEndsOn?: string, academicYearId?: string): Promise<TimetableWorkspace>;
    occurrences(user: AuthenticatedUser, organizationId: string, query: TimetableQueryDto): Promise<{
        items: import("@moshaver/api-contract").TimetableOccurrence[];
        total: number;
        offset: number;
        limit: number;
    }>;
    attendanceReport(user: AuthenticatedUser, organizationId: string, query: TimetableQueryDto): Promise<TimetableAttendanceReport>;
    versions(user: AuthenticatedUser, organizationId: string, query: TimetableQueryDto): Promise<{
        items: VersionContract[];
        total: number;
        offset: number;
        limit: number;
    }>;
    history(user: AuthenticatedUser, id: string, page: TimetablePageDto): Promise<{
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
    }>;
    archive(user: AuthenticatedUser, id: string, dto: TimetablePublishDto): Promise<VersionContract>;
    bulk(user: AuthenticatedUser, id: string, dto: TimetableBulkDto, preview?: boolean): Promise<{
        valid: boolean;
        conflicts: import("@moshaver/api-contract").TimetableConflict[];
        revision: number;
        ids?: undefined;
    } | {
        ids: string[];
        revision: number;
        valid?: undefined;
        conflicts?: undefined;
    }>;
    createVersion(user: AuthenticatedUser, organizationId: string, dto: TimetableVersionDto): Promise<VersionContract>;
    private saveLesson;
    writeLesson(user: AuthenticatedUser, versionId: string, dto: TimetableLessonWriteDto, id?: string, preview?: boolean): Promise<{
        conflicts: import("@moshaver/api-contract").TimetableConflict[];
        id?: undefined;
        revision?: undefined;
    } | {
        id: string;
        revision: number;
        conflicts?: undefined;
    }>;
    removeLesson(user: AuthenticatedUser, versionId: string, id: string, expectedRevision: number): Promise<{
        revision: number;
    }>;
    publish(user: AuthenticatedUser, id: string, dto: TimetablePublishDto): Promise<VersionContract>;
    private notifyChange;
    override(user: AuthenticatedUser, id: string, dto: TimetableOverrideDto): Promise<{
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
    }>;
    config(user: AuthenticatedUser, organizationId: string, dto: TimetableConfigDto): Promise<EducationClass | TimetableAllocation | TimetableAcademicYear | TimetableTerm | TimetablePeriod | TimetableDailySession | TimetableBellSchedule | TimetableLocation | TimetableHoliday | TimetableTeacherAvailability | TimetableSection>;
    private previewRows;
    previewImport(user: AuthenticatedUser, id: string, dto: TimetableImportDto): Promise<{
        valid: boolean;
        revision: number;
        rows: {
            row: number;
            source: string;
            errors: string[];
        }[];
        conflicts: import("@moshaver/api-contract").TimetableConflict[];
    }>;
    private importFingerprint;
    commitImport(user: AuthenticatedUser, id: string, dto: TimetableImportDto): Promise<{
        imported: number;
        revision: number;
        duplicate: boolean;
    }>;
    openAttendance(user: AuthenticatedUser, id: string, date: string): Promise<{
        sessionId: string;
        cancelled: boolean;
    }>;
}
