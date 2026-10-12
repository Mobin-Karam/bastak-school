import { AttendanceSession } from "./attendance-session.entity";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";
export type AttendanceWriteResult = {
    sessionId: string;
    revision?: number;
    status?: import("./attendance-session.entity").AttendanceSessionStatus;
    count: number;
    records: Array<{
        id: string;
        studentId: string;
        status: string;
        note: string;
    }>;
};
export declare class AttendanceWriteReceipt {
    id: string;
    organization: Organization;
    actor: User;
    session: AttendanceSession;
    requestId: string;
    fingerprint: string;
    result: AttendanceWriteResult;
    createdAt: Date;
}
