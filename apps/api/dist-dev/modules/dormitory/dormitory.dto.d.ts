export declare class CreateDormRoomDto {
    organizationId: string;
    code: string;
    name: string;
    building?: string;
    floor?: number;
    capacity?: number;
}
export declare class SetDormRoomAssignmentsDto {
    studentIds: string[];
}
export declare class SendDormAnnouncementDto {
    organizationId: string;
    title: string;
    body: string;
    target: "ROOM" | "STUDENT";
    roomId?: string;
    studentId?: string;
}
