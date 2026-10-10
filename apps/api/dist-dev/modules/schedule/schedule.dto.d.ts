export declare class SaveScheduleEntryDto {
    organizationId: string;
    classroomId?: string;
    classBookId?: string;
    teacherId?: string;
    title: string;
    weekday: number;
    startTime: string;
    endTime: string;
    room?: string;
}
export declare class ArchiveScheduleEntryDto {
    status: "ACTIVE" | "ARCHIVED";
}
