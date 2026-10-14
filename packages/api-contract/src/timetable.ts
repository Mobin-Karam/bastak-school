export type TimetableState = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TimetableSessionKind = "MORNING" | "AFTERNOON" | "OTHER";
export type TimetableOption = { id: string; name: string };
export type TimetableYear = TimetableOption & {
  organizationId: string;
  startsOn: string;
  endsOn: string;
  timeZone: string;
  active: boolean;
};
export type TimetableTerm = TimetableOption & {
  yearId: string;
  startsOn: string;
  endsOn: string;
};
export type TimetableSection = TimetableOption & { organizationId: string };
export type TimetableLocation = TimetableOption & {
  organizationId: string;
  capacity: number;
};
export type TimetableBell = TimetableOption & {
  organizationId: string;
  sectionId: string | null;
};
export type TimetableSession = TimetableOption & {
  bellId: string;
  kind: TimetableSessionKind;
  startTime: string;
  endTime: string;
};
export type TimetablePeriod = TimetableOption & {
  sessionId: string;
  ordinal: number;
  weekdays?: number[];
  startTime: string;
  endTime: string;
};
export type TimetableVersion = {
  id: string;
  termId: string;
  name: string;
  state: TimetableState;
  revision: number;
  effectiveOn: string;
  publishedAt: string | null;
  reason: string;
  createdAt: string;
};
export type TimetableLessonDraft = {
  classroomId: string;
  classBookId: string;
  teacherId?: string | null;
  periodId: string;
  locationId?: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
  startsOn: string;
  endsOn: string;
  notes?: string;
};
export type TimetableLesson = TimetableLessonDraft & {
  id: string;
  versionId: string;
  title: string;
  classroomName: string;
  teacherName: string;
  locationName: string;
  sectionId: string | null;
  gradeId: number | null;
  periodName: string;
  sessionKind: TimetableSessionKind;
};
export type TimetableOverrideDraft = {
  lessonId: string;
  date: string;
  cancelled: boolean;
  teacherId?: string | null;
  locationId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  reason: string;
};
export type TimetableOverride = TimetableOverrideDraft & {
  id: string;
  changedByName: string;
  createdAt: string;
};
export type TimetableHoliday = {
  /** Present when composing calendars from multiple executing versions. */
  versionId?: string;
  id: string;
  termId: string;
  date: string;
  name: string;
};
export type TimetableAvailability = {
  id: string;
  organizationId: string;
  teacherId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  startsOn: string;
  endsOn: string;
  reason: string;
};
export type TimetableAllocation = {
  id: string;
  versionId: string;
  classroomId: string;
  classBookId: string;
  lessonsPerWeek: number;
};
export type TimetableConflict = {
  code:
    | "ROOM_CAPACITY"
    | "NO_OCCURRENCE"
    | "CLASS_OVERLAP"
    | "TEACHER_OVERLAP"
    | "ROOM_OVERLAP"
    | "TEACHER_UNAVAILABLE"
    | "OUTSIDE_SESSION"
    | "UNASSIGNED"
    | "INCOMPLETE_ALLOCATION";
  lessonIds: string[];
  date?: string;
  message: string;
  alternatives: string[];
};
export type TimetableOccurrence = TimetableLesson & {
  date: string;
  cancelled: boolean;
  changeReason: string;
  attendanceSessionId: string | null;
  startsAt: string;
  endsAt: string;
};
export type TimetableChange = {
  id: string;
  versionId: string;
  lessonId: string | null;
  action: string;
  reason: string;
  actorName: string;
  createdAt: string;
  beforeText: string;
  afterText: string;
};
export type TimetableImportRow = {
  source: string;
  lesson: TimetableLessonDraft;
};
export type TimetableImportPreview = {
  valid: boolean;
  revision: number;
  rows: Array<{ row: number; source: string; errors: string[] }>;
  conflicts: TimetableConflict[];
};
export type TimetableWorkspace = {
  organizationId: string;
  years: TimetableYear[];
  terms: TimetableTerm[];
  sections: TimetableSection[];
  locations: TimetableLocation[];
  bells: TimetableBell[];
  sessions: TimetableSession[];
  periods: TimetablePeriod[];
  versions: TimetableVersion[];
  lessons: TimetableLesson[];
  overrides: TimetableOverride[];
  holidays: TimetableHoliday[];
  availability: TimetableAvailability[];
  allocations: TimetableAllocation[];
  changes: TimetableChange[];
  classes: Array<
    TimetableOption & {
      gradeId: number | null;
      schoolYear: string;
      sectionId: string | null;
      books: Array<
        TimetableOption & { teacherId: string; teacherName: string }
      >;
    }
  >;
  teachers: TimetableOption[];
  conflicts: TimetableConflict[];
  occurrences: TimetableOccurrence[];
};

export type TimetablePage<T> = {
  items: T[];
  total: number;
  offset: number;
  limit: number;
};
export type TimetableOccurrenceQuery = {
  versionId?: string;
  classroomId?: string;
  teacherId?: string;
  studentId?: string;
  academicYearId?: string;
  locationId?: string;
  view?: "DAILY" | "WEEKLY";
  startsOn?: string;
  endsOn?: string;
  offset?: number;
  limit?: number;
};
export type TimetableBulkWrite = {
  expectedRevision: number;
  items: Array<{ id?: string; lesson: TimetableLessonDraft }>;
};
