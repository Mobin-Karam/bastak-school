import { Organization } from "./organization.entity";
import { User } from "./user.entity";
export declare class AttendanceSchedule {
    id: string;
    organization: Organization;
    contextType: "class_group" | "dorm";
    contextId: string;
    title: string;
    weekday: number;
    startTime: string;
    endTime: string;
    assignedStaff?: User | null;
    status: "ACTIVE" | "ARCHIVED";
    createdAt: Date;
    updatedAt: Date;
}
