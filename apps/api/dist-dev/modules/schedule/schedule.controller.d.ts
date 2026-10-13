import { AuthenticatedUser } from "../auth";
import { ArchiveScheduleEntryDto, SaveScheduleEntryDto } from "./schedule.dto";
import { ScheduleService } from "./schedule.service";
export declare class ScheduleController {
    private readonly schedule;
    constructor(schedule: ScheduleService);
    list(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
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
                classroom: import("../../database/entities").EducationClass;
                book: import("../../database/entities").EducationBook;
                createdAt: Date;
            } | null;
            id: string;
            organization: import("../../database/entities").Organization;
            classroom?: import("../../database/entities").EducationClass | null;
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
    export(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
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
                classroom: import("../../database/entities").EducationClass;
                book: import("../../database/entities").EducationBook;
                createdAt: Date;
            } | null;
            id: string;
            organization: import("../../database/entities").Organization;
            classroom?: import("../../database/entities").EducationClass | null;
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
    create(user: AuthenticatedUser, dto: SaveScheduleEntryDto): Promise<{
        ok: boolean;
        data: {
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
                classroom: import("../../database/entities").EducationClass;
                book: import("../../database/entities").EducationBook;
                createdAt: Date;
            } | null;
            id: string;
            organization: import("../../database/entities").Organization;
            classroom?: import("../../database/entities").EducationClass | null;
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
        };
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
                    classroom: import("../../database/entities").EducationClass;
                    book: import("../../database/entities").EducationBook;
                    createdAt: Date;
                } | null;
                id: string;
                organization: import("../../database/entities").Organization;
                classroom?: import("../../database/entities").EducationClass | null;
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
        };
    }>;
    update(user: AuthenticatedUser, id: string, dto: SaveScheduleEntryDto): Promise<{
        ok: boolean;
        data: {
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
                classroom: import("../../database/entities").EducationClass;
                book: import("../../database/entities").EducationBook;
                createdAt: Date;
            } | null;
            id: string;
            organization: import("../../database/entities").Organization;
            classroom?: import("../../database/entities").EducationClass | null;
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
        };
    }>;
    archive(user: AuthenticatedUser, id: string, dto: ArchiveScheduleEntryDto): Promise<{
        ok: boolean;
        data: {
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
                classroom: import("../../database/entities").EducationClass;
                book: import("../../database/entities").EducationBook;
                createdAt: Date;
            } | null;
            id: string;
            organization: import("../../database/entities").Organization;
            classroom?: import("../../database/entities").EducationClass | null;
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
        };
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            deleted: boolean;
        };
    }>;
}
