import { Repository } from "typeorm";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access/school-access.service";
import { CreateDormRoomDto } from "./dormitory.dto";
export declare class DormitoryService {
    private readonly rooms;
    private readonly assignments;
    private readonly students;
    private readonly access;
    constructor(rooms: Repository<DormRoom>, assignments: Repository<DormRoomAssignment>, students: Repository<Student>, access: SchoolAccessService);
    listRooms(user: AuthenticatedUser, organizationId?: string): Promise<{
        id: string;
        organizationId: string;
        organizationName: string;
        code: string;
        name: string;
        capacity: number;
        status: "ARCHIVED" | "ACTIVE";
        studentCount: number;
    }[]>;
    createRoom(user: AuthenticatedUser, dto: CreateDormRoomDto): Promise<{
        id: string;
        organizationId: string;
        code: string;
        name: string;
        capacity: number;
        status: "ARCHIVED" | "ACTIVE";
        studentCount: number;
    }>;
    listAssignments(user: AuthenticatedUser, roomId: string): Promise<{
        id: string;
        studentId: string;
        name: string;
        nationalCode: string | null | undefined;
        userId: string | null;
    }[]>;
    setAssignments(user: AuthenticatedUser, roomId: string, studentIds: string[]): Promise<{
        roomId: string;
        count: number;
    }>;
    private requireRoom;
}
