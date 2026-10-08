import { Organization } from "./organization.entity";
import { DormRoomAssignment } from "./dorm-room-assignment.entity";
export declare class DormRoom {
    id: string;
    organization: Organization;
    code: string;
    name: string;
    building: string;
    floor: number;
    capacity: number;
    status: "ACTIVE" | "ARCHIVED";
    assignments: DormRoomAssignment[];
    createdAt: Date;
    updatedAt: Date;
}
