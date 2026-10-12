import type { DormRoom } from "./dorm-room.entity";
import { Student } from "./student.entity";
export declare class DormRoomAssignment {
    id: string;
    room: DormRoom;
    student: Student;
    createdAt: Date;
    updatedAt: Date;
}
