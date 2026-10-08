import { AuthenticatedUser } from "../auth";
import { CreateDormRoomDto, SetDormRoomAssignmentsDto } from "./dormitory.dto";
import { DormitoryService } from "./dormitory.service";
export declare class DormitoryController {
    private readonly dormitory;
    constructor(dormitory: DormitoryService);
    rooms(user: AuthenticatedUser, organizationId?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            code: string;
            name: string;
            capacity: number;
            status: "ARCHIVED" | "ACTIVE";
            studentCount: number;
        }[];
    }>;
    create(user: AuthenticatedUser, dto: CreateDormRoomDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            code: string;
            name: string;
            capacity: number;
            status: "ARCHIVED" | "ACTIVE";
            studentCount: number;
        };
    }>;
    assignments(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            studentId: string;
            name: string;
            nationalCode: string | null | undefined;
            userId: string | null;
        }[];
    }>;
    setAssignments(user: AuthenticatedUser, id: string, dto: SetDormRoomAssignmentsDto): Promise<{
        ok: boolean;
        data: {
            roomId: string;
            count: number;
        };
    }>;
}
