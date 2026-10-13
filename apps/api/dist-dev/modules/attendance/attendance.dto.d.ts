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
    expectedRevision?: number;
    requestId?: string;
    organizationId: string;
    sessionId?: string;
    contextType?: "class" | "class_group" | "dorm";
    contextId?: string;
    sessionDate?: string;
    entries: AttendanceEntryDto[];
}
export declare class ReviewAttendanceAbsenceDto {
    decision: "approved" | "rejected";
    note?: string;
}
export declare class ResolveAttendanceSessionDto {
    organizationId: string;
    source: "class_schedule" | "attendance_schedule";
    scheduleId: string;
    calendarDate: string;
}
export declare class CreateExceptionalAttendanceSessionDto {
    requestId: string;
    organizationId: string;
    contextType: "class" | "class_group" | "dorm";
    contextId: string;
    sessionDate: string;
    reason: string;
}
export declare class SessionAttendanceEntryDto {
    studentId: string;
    status: "present" | "absent" | "late";
    note?: string;
    minutesLate?: number;
    arrivalAt?: string;
}
export declare class SaveAttendanceSessionRecordsDto {
    requestId: string;
    expectedRevision: number;
    entries: SessionAttendanceEntryDto[];
}
export declare class SubmitAttendanceSessionDto {
    requestId: string;
    expectedRevision: number;
    confirmPartial?: boolean;
}
export declare class SetDormAttendanceDelegateDto {
    studentId: string;
    startsOn: string;
    endsOn: string;
}
export declare class DelegatedDormAttendanceDto {
    requestId: string;
    expectedRevision: number;
    nightDate: string;
    entries: SessionAttendanceEntryDto[];
}
export declare class CreateAttendancePoolDto {
    requestId: string;
    organizationId: string;
    title: string;
    place: string;
    contextType: "class" | "class_group" | "dorm";
    contextId: string;
    durationMinutes: number;
}
export declare class AttendancePoolCheckInDto {
    confirmation: "here";
}
