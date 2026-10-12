import { Organization } from "./organization.entity";
import { AttendanceSession } from "./attendance-session.entity";
export declare class AttendancePool {
    id: string;
    organization: Organization;
    session: AttendanceSession;
    place: string;
    endsAt: Date;
    closedAt?: Date | null;
    createdAt: Date;
}
