import { Organization } from "./organization.entity";
import { User } from "./user.entity";
import { AttendanceRecord } from "./attendance-record.entity";
export type AttendanceContextType = "class" | "class_group" | "study_group" | "dorm" | "night";
export declare class AttendanceSession {
    id: string;
    organization: Organization;
    contextType: AttendanceContextType;
    contextId: string;
    sessionDate: Date;
    note: string;
    createdBy?: User | null;
    createdAt: Date;
    updatedAt: Date;
    records: AttendanceRecord[];
}
