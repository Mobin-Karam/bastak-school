import { Repository } from "typeorm";
import type { AttendanceDailyOverview, AttendanceEncouragement, DormAttendanceAssignment, StaffAttendanceProfile, StaffAttendanceSession } from "@moshaver/api-contract";
import { AttendanceSession } from "../../database/entities/attendance-session.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { RealtimeService } from "../realtime";
import { AttendanceService } from "./attendance.service";
import { CreateAttendancePoolDto, DelegatedDormAttendanceDto, SetDormAttendanceDelegateDto } from "./attendance.dto";
export declare function attendanceSummaryWindow(now?: Date): {
    day: string;
    startsAt: Date;
    resetsAt: Date;
};
export declare class AttendanceOperationsService {
    private readonly sessions;
    private readonly attendance;
    private readonly access;
    private readonly realtime;
    constructor(sessions: Repository<AttendanceSession>, attendance: AttendanceService, access: SchoolAccessService, realtime: RealtimeService);
    private repo;
    private requireCapability;
    private staff;
    private orgIds;
    private selfStudent;
    private delegateView;
    delegates(user: AuthenticatedUser): Promise<{
        id: string;
        roomId: string;
        roomName: string;
        studentId: string;
        studentName: string;
        startsOn: string;
        endsOn: string;
        revoked: boolean;
        dormWide: boolean;
    }[]>;
    setDelegate(user: AuthenticatedUser, roomId: string, dto: SetDormAttendanceDelegateDto): Promise<{
        id: string;
        roomId: string;
        roomName: string;
        studentId: string;
        studentName: string;
        startsOn: string;
        endsOn: string;
        revoked: boolean;
        dormWide: boolean;
    }>;
    dormResidents(user: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        organizationId: string;
        userId: string;
    }[]>;
    setDormWideDelegate(user: AuthenticatedUser, dto: SetDormAttendanceDelegateDto): Promise<{
        id: string;
        roomId: string;
        roomName: string;
        studentId: string;
        studentName: string;
        startsOn: string;
        endsOn: string;
        revoked: boolean;
        dormWide: boolean;
    }[]>;
    revokeDormWideDelegate(user: AuthenticatedUser): Promise<{
        revoked: boolean;
    }>;
    private isDormResident;
    revokeDelegate(user: AuthenticatedUser, roomId: string): Promise<{
        revoked: boolean;
    }>;
    private residentRoster;
    myDormAssignments(user: AuthenticatedUser): Promise<DormAttendanceAssignment[]>;
    markDorm(user: AuthenticatedUser, id: string, dto: DelegatedDormAttendanceDto): Promise<{
        sessionId: string;
        count: number;
    }>;
    private snapshot;
    private poolView;
    pools(user: AuthenticatedUser): Promise<PoolView[]>;
    createPool(user: AuthenticatedUser, dto: CreateAttendancePoolDto): Promise<PoolView>;
    closePool(user: AuthenticatedUser, id: string): Promise<{
        closed: boolean;
    }>;
    myPools(user: AuthenticatedUser): Promise<{
        id: string;
        title: string;
        place: string;
        endsAt: string;
    }[]>;
    checkIn(user: AuthenticatedUser, id: string): Promise<{
        confirmed: boolean;
    }>;
    staffSessions(user: AuthenticatedUser): Promise<StaffAttendanceSession[]>;
    dailyOverview(user: AuthenticatedUser): Promise<AttendanceDailyOverview>;
    staffProfile(user: AuthenticatedUser, id: string): Promise<StaffAttendanceProfile>;
    encouragement(user: AuthenticatedUser): Promise<AttendanceEncouragement>;
    private counts;
    private audit;
}
