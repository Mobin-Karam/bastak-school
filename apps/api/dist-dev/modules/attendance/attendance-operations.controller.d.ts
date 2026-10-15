import { AuthenticatedUser } from "../auth";
import { AttendanceOperationsService } from "./attendance-operations.service";
import { AttendancePoolCheckInDto, CreateAttendancePoolDto, DelegatedDormAttendanceDto, SetDormAttendanceDelegateDto } from "./attendance.dto";
export declare class AttendanceOperationsController {
    private readonly operations;
    constructor(operations: AttendanceOperationsService);
    delegates(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            roomId: string;
            roomName: string;
            studentId: string;
            studentName: string;
            startsOn: string;
            endsOn: string;
            revoked: boolean;
            dormWide: boolean;
        }[];
    }>;
    residents(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            organizationId: string;
            userId: string;
        }[];
    }>;
    delegateAll(user: AuthenticatedUser, dto: SetDormAttendanceDelegateDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            roomId: string;
            roomName: string;
            studentId: string;
            studentName: string;
            startsOn: string;
            endsOn: string;
            revoked: boolean;
            dormWide: boolean;
        }[];
    }>;
    revokeAll(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            revoked: boolean;
        };
    }>;
    delegate(user: AuthenticatedUser, id: string, dto: SetDormAttendanceDelegateDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            roomId: string;
            roomName: string;
            studentId: string;
            studentName: string;
            startsOn: string;
            endsOn: string;
            revoked: boolean;
            dormWide: boolean;
        };
    }>;
    revoke(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            revoked: boolean;
        };
    }>;
    pools(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").AttendancePool[];
    }>;
    createPool(user: AuthenticatedUser, dto: CreateAttendancePoolDto): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").AttendancePool;
    }>;
    closePool(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            closed: boolean;
        };
    }>;
    overview(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").AttendanceDailyOverview;
    }>;
    sessions(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").StaffAttendanceSession[];
    }>;
    profile(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").StaffAttendanceProfile;
    }>;
    encouragement(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").AttendanceEncouragement;
    }>;
    assignments(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("@moshaver/api-contract").DormAttendanceAssignment[];
    }>;
    markDorm(user: AuthenticatedUser, id: string, dto: DelegatedDormAttendanceDto): Promise<{
        ok: boolean;
        data: {
            sessionId: string;
            count: number;
        };
    }>;
    myPools(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            title: string;
            place: string;
            endsAt: string;
        }[];
    }>;
    checkIn(user: AuthenticatedUser, id: string, _dto: AttendancePoolCheckInDto): Promise<{
        ok: boolean;
        data: {
            confirmed: boolean;
        };
    }>;
}
