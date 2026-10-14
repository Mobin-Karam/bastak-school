declare class DatesDto {
    startsOn: string;
    endsOn: string;
}
export declare class TimetableRevisionDto {
    expectedRevision: number;
}
export declare class TimetableLessonDto extends DatesDto {
    classroomId: string;
    classBookId: string;
    teacherId?: string | null;
    periodId: string;
    locationId?: string | null;
    weekday: number;
    startTime: string;
    endTime: string;
    notes?: string;
}
export declare class TimetableLessonWriteDto extends TimetableRevisionDto {
    lesson: TimetableLessonDto;
}
export declare class TimetableVersionDto {
    termId: string;
    name: string;
    copyVersionId?: string;
    effectiveOn: string;
    reason: string;
}
export declare class TimetablePublishDto extends TimetableRevisionDto {
    reason: string;
}
export declare class TimetableOverrideDto extends TimetablePublishDto {
    lessonId: string;
    date: string;
    cancelled: boolean;
    teacherId?: string | null;
    locationId?: string | null;
    startTime?: string;
    endTime?: string;
}
export declare class TimetableConfigDto {
    kind: string;
    id?: string;
    parentId?: string;
    name?: string;
    startsOn?: string;
    endsOn?: string;
    date?: string;
    timeZone?: string;
    active?: boolean;
    sectionId?: string | null;
    sessionKind?: "MORNING" | "AFTERNOON" | "OTHER";
    startTime?: string;
    endTime?: string;
    number?: number;
    weekdays?: number[];
    weekday?: number;
    teacherId?: string;
    classroomId?: string;
    classBookId?: string;
    reason?: string;
    expectedRevision?: number;
}
export declare class TimetableImportRowDto {
    source: string;
    lesson: TimetableLessonDto;
}
export declare class TimetableImportDto extends TimetableRevisionDto {
    filename: string;
    sheetName: string;
    rows: TimetableImportRowDto[];
}
export declare class TimetableAttendanceDto {
    date: string;
}
export declare class TimetablePageDto {
    offset: number;
    limit: number;
}
export declare class TimetableQueryDto extends TimetablePageDto {
    versionId?: string;
    classroomId?: string;
    teacherId?: string;
    studentId?: string;
    academicYearId?: string;
    locationId?: string;
    view?: "DAILY" | "WEEKLY";
    startsOn?: string;
    endsOn?: string;
}
export declare class TimetableBulkItemDto {
    id?: string;
    lesson: TimetableLessonDto;
}
export declare class TimetableBulkDto extends TimetableRevisionDto {
    items: TimetableBulkItemDto[];
}
export {};
