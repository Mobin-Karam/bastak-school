import { DataSource } from "typeorm";
import type { TimetableWorkspace, TimetableVersion as VersionContract } from "@moshaver/api-contract";
import { TimetableAcademicYear, TimetableTerm, TimetableSection, TimetableLocation, TimetableBellSchedule, TimetableDailySession, TimetablePeriod, TimetableHoliday, TimetableTeacherAvailability, TimetableAllocation } from "../../database/entities/timetable.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { AttendanceService } from "../attendance";
import { NotificationsService } from "../notifications";
import { TimetableConfigDto, TimetableLessonWriteDto, TimetableVersionDto, TimetablePublishDto, TimetableOverrideDto, TimetableImportDto } from "./timetable.dto";
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
    private validateLesson;
    private lessonViews;
    private versionData;
    workspace(user: AuthenticatedUser, organizationId: string, versionId?: string, startsOn?: string): Promise<TimetableWorkspace>;
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
    config(user: AuthenticatedUser, organizationId: string, dto: TimetableConfigDto): Promise<EducationClass | TimetableAcademicYear | TimetableTerm | TimetableSection | TimetableLocation | TimetableBellSchedule | TimetableDailySession | TimetablePeriod | TimetableHoliday | TimetableTeacherAvailability | TimetableAllocation>;
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
    commitImport(user: AuthenticatedUser, id: string, dto: TimetableImportDto): Promise<{
        imported: number;
        revision: number;
    }>;
    openAttendance(user: AuthenticatedUser, id: string, date: string): Promise<{
        sessionId: string;
        cancelled: boolean;
    }>;
}
