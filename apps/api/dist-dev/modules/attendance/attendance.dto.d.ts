export declare class CreateAttendanceSessionDto {
    organizationId: string;
    contextType: "class" | "class_group" | "dorm";
    contextId: string;
    sessionDate: string;
    note?: string;
}
export declare class AttendanceEntryDto {
    studentId: string;
    status: "present" | "absent" | "late" | "excused";
    note?: string;
}
export declare class BulkMarkAttendanceDto {
    organizationId: string;
    sessionId?: string;
    contextType?: "class" | "class_group" | "dorm";
    contextId?: string;
    sessionDate?: string;
    entries: AttendanceEntryDto[];
}
