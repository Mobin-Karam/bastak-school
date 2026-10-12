export declare class TimetableAcademicYear {
    id: string;
    organizationId: string;
    organization?: object;
    name: string;
    startsOn: string;
    endsOn: string;
    timeZone: string;
    active: boolean;
    createdAt: Date;
}
export declare class TimetableTerm {
    id: string;
    yearId: string;
    year?: object;
    name: string;
    startsOn: string;
    endsOn: string;
    createdAt: Date;
}
export declare class TimetableSection {
    id: string;
    organizationId: string;
    organization?: object;
    name: string;
    createdAt: Date;
}
export declare class TimetableLocation {
    id: string;
    organizationId: string;
    organization?: object;
    name: string;
    capacity: number;
    createdAt: Date;
}
export declare class TimetableBellSchedule {
    id: string;
    organizationId: string;
    organization?: object;
    sectionId: string | null;
    section?: object;
    name: string;
    createdAt: Date;
}
export declare class TimetableDailySession {
    id: string;
    bellId: string;
    bell?: object;
    name: string;
    kind: "MORNING" | "AFTERNOON" | "OTHER";
    startTime: string;
    endTime: string;
    createdAt: Date;
}
export declare class TimetablePeriod {
    id: string;
    sessionId: string;
    session?: object;
    name: string;
    ordinal: number;
    startTime: string;
    endTime: string;
    createdAt: Date;
}
export declare class TimetableVersion {
    id: string;
    termId: string;
    term?: object;
    name: string;
    state: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    revision: number;
    effectiveOn: string;
    publishedAt: Date | null;
    reason: string;
    createdById: string;
    createdBy?: object;
    createdAt: Date;
}
export declare class TimetableHoliday {
    id: string;
    termId: string;
    term?: object;
    date: string;
    name: string;
    createdAt: Date;
}
export declare class TimetableTeacherAvailability {
    id: string;
    organizationId: string;
    organization?: object;
    teacherId: string;
    teacher?: object;
    weekday: number;
    startTime: string;
    endTime: string;
    startsOn: string;
    endsOn: string;
    reason: string;
    createdAt: Date;
}
export declare class TimetableAllocation {
    id: string;
    versionId: string;
    version?: object;
    classroomId: string;
    classroom?: object;
    classBookId: string;
    classBook?: object;
    lessonsPerWeek: number;
    createdAt: Date;
}
export declare class TimetableOverride {
    id: string;
    versionId: string;
    version?: object;
    lessonId: string;
    lesson?: object;
    date: string;
    cancelled: boolean;
    teacherId: string | null;
    teacher?: object;
    locationId: string | null;
    location?: object;
    startTime: string | null;
    endTime: string | null;
    reason: string;
    changedById: string;
    changedBy?: object;
    changedByName: string;
    createdAt: Date;
}
export declare class TimetableOccurrence {
    id: string;
    lessonId: string;
    lesson?: object;
    date: string;
    attendanceSessionId: string | null;
    attendanceSession?: object;
    createdAt: Date;
}
export declare class TimetableChange {
    id: string;
    versionId: string;
    version?: object;
    lessonId: string | null;
    lesson?: object;
    action: string;
    reason: string;
    actorId: string;
    actor?: object;
    actorName: string;
    beforeText: string;
    afterText: string;
    createdAt: Date;
}
export declare class TimetableImport {
    id: string;
    versionId: string;
    version?: object;
    actorId: string;
    actor?: object;
    filename: string;
    sheetName: string;
    rowCount: number;
    revision: number;
    createdAt: Date;
}
