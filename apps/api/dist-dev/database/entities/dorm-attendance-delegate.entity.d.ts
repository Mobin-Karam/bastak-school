import { Organization } from "./organization.entity";
import { DormRoom } from "./dorm-room.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare class DormAttendanceDelegate {
    id: string;
    organization: Organization;
    room: DormRoom;
    student: Student;
    grantedBy?: User | null;
    startsOn: string;
    endsOn: string;
    dormWide: boolean;
    revoked: boolean;
    createdAt: Date;
    updatedAt: Date;
}
