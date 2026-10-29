export type AttendanceContext = "class" | "class_group" | "dorm";
export type PhysicalAttendanceStatus = "present" | "absent" | "late";
export type AttendanceSessionStatus =
  "scheduled" | "open" | "draft" | "submitted" | "finalized" | "cancelled";
export type AttendanceRosterMember = {
  id: string;
  name: string;
  nationalCode: string | null;
  userId: string | null;
};
export type SavedAttendanceRecord = {
  id: string;
  studentId: string;
  physicalStatus: PhysicalAttendanceStatus | "legacy_unknown";
  legacyStatus: "present" | "absent" | "late" | "excused";
  note: string;
  revision: number;
  minutesLate: number | null;
  arrivalAt: string | null;
  recordedById: string | null;
  recordedByName: string;
  recordedAt: string;
  reviewStatus: "pending" | "approved" | "rejected" | null;
  reviewNote: string;
  reviewedAt: string | null;
};
export type AttendanceSessionDetail = {
  id: string;
  organizationId: string;
  organizationName: string;
  contextType: AttendanceContext | "night" | "pool";
  contextId: string;
  title: string;
  subjectId: string | null;
  subjectName: string | null;
  academicYearId: string | null;
  academicYearName: string | null;
  termId: string | null;
  termName: string | null;
  operationalDate: string | null;
  sessionDate: string;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  timeZone: string;
  /** Optional for compatibility with saved-session clients during the additive rollout. */
  sourceKind?: string | null;
  status: AttendanceSessionStatus;
  revision: number;
  assignedStaffId: string | null;
  assignedStaffName: string;
  submittedAt: string | null;
  submittedById: string | null;
  roster: AttendanceRosterMember[];
  rosterComplete: boolean;
  records: SavedAttendanceRecord[];
  expected: number | null;
  marked: number;
  unmarked: number | null;
  canManage: boolean;
  canCorrect: boolean;
};
export type AttendanceSessionWrite = {
  requestId: string;
  expectedRevision: number;
  entries: Array<{
    studentId: string;
    status: PhysicalAttendanceStatus;
    note?: string;
    minutesLate?: number;
    arrivalAt?: string;
  }>;
};
export type AttendanceSessionWriteResult = {
  sessionId: string;
  revision: number;
  status: AttendanceSessionStatus;
  count: number;
};
export type SubmitAttendanceAbsences = {
  requestId: string;
  expectedRevision: number;
  absentStudentIds: string[];
  lateStudentIds?: string[];
  excusedStudentIds?: string[];
};
export type ResolveAttendanceSession = {
  organizationId: string;
  source: "class_schedule" | "attendance_schedule";
  scheduleId: string;
  calendarDate: string;
};
export type AttendancePolicyContract = {
  organizationId: string;
  timeZone: string;
  dayStartsAt: string;
  allowPartialSubmission: boolean;
  lateCountsAsPresent: boolean;
  correctionRequiresReview: boolean;
};
