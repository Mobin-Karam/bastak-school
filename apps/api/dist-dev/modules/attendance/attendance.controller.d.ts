import { AuthenticatedUser } from "../auth";
import { AttendanceService } from "./attendance.service";
import { BulkMarkAttendanceDto, CreateAttendanceSessionDto } from "./attendance.dto";
export declare class AttendanceController {
    private readonly attendance;
    constructor(attendance: AttendanceService);
    contexts(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: ({
            id: string;
            contextType: "class";
            code: string;
            name: string;
            label: string;
            total: number;
            activeOrganizationId: string;
        } | {
            id: string;
            contextType: "class_group";
            code: string;
            name: string;
            label: string;
            total: number;
            activeOrganizationId: string;
        } | {
            id: string;
            contextType: "dorm";
            code: string;
            name: string;
            label: string;
            total: number;
            activeOrganizationId: string;
        })[];
    }>;
    participants(user: AuthenticatedUser, contextType: string, contextId: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            userId: string | null;
            nationalCode: string | null | undefined;
            accountStatus: "active" | "inactive" | "archived";
        }[];
    }>;
    sessions(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            remaining: number;
            note: string;
            createdById: string | null;
            createdAt: string;
            present: number;
            absent: number;
            late: number;
            excused: number;
            id: string;
            organizationId: string;
            organizationName: string;
            contextType: "class" | "dorm" | "class_group" | "night";
            contextId: string;
            contextLabel: string;
            sessionDate: string;
            total: number;
        }[];
    }>;
    create(user: AuthenticatedUser, dto: CreateAttendanceSessionDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            contextType: import("../../database/entities/attendance-session.entity").AttendanceContextType;
            contextId: string;
            sessionDate: string;
            note: string;
        };
    }>;
    bulk(user: AuthenticatedUser, dto: BulkMarkAttendanceDto): Promise<{
        ok: boolean;
        data: {
            sessionId: string;
            count: number;
            records: {
                id: string;
                studentId: string;
                status: import("../../database/entities").AttendanceStatus;
                note: string;
            }[];
        };
    }>;
    selfSummary(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            recent: {
                id: string;
                sessionId: string;
                status: import("../../database/entities").AttendanceStatus;
                sessionDate: string;
                contextType: "class" | "dorm" | "class_group" | "night";
                contextId: string;
                organizationId: string;
                recordedAt: string;
            }[];
            present: number;
            absent: number;
            late: number;
            excused: number;
            studentId: string;
            totalSessions: number;
        };
    }>;
    selfRecords(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: import("../../database/entities").AttendanceStatus;
            note: string;
            sessionDate: string;
            contextType: "class" | "dorm" | "class_group" | "night";
            contextId: string;
            organizationId: string;
            recordedAt: string;
        }[];
    }>;
    studentSummary(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            recent: {
                id: string;
                sessionId: string;
                status: import("../../database/entities").AttendanceStatus;
                sessionDate: string;
                contextType: "class" | "dorm" | "class_group" | "night";
                contextId: string;
                organizationId: string;
                recordedAt: string;
            }[];
            present: number;
            absent: number;
            late: number;
            excused: number;
            studentId: string;
            totalSessions: number;
        };
    }>;
}
