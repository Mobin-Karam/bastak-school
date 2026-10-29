import type {
  AttendanceContext,
  AttendanceRosterMember,
  PhysicalAttendanceStatus,
} from "./attendance";

export type DormAttendanceDelegate = {
  id: string;
  roomId: string;
  roomName: string;
  studentId: string;
  studentName: string;
  startsOn: string;
  endsOn: string;
  revoked: boolean;
  dormWide?: boolean;
};
export type DormAttendanceAssignment = DormAttendanceDelegate & {
  nightDate: string;
  revision: number;
  canMark: boolean;
  roster: Array<{ id: string; name: string }>;
  records: Array<{ studentId: string; status: PhysicalAttendanceStatus }>;
};
export type DormDelegateDraft = {
  studentId: string;
  startsOn: string;
  endsOn: string;
};
export type DormAttendanceWrite = {
  requestId: string;
  expectedRevision: number;
  nightDate: string;
  entries: Array<{ studentId: string; status: PhysicalAttendanceStatus }>;
};
export type AttendancePoolDraft = {
  requestId: string;
  organizationId: string;
  title: string;
  place: string;
  contextType: AttendanceContext;
  contextId: string;
  durationMinutes: number;
};
export type AttendancePool = {
  contextId: string;
  id: string;
  sessionId: string;
  title: string;
  place: string;
  endsAt: string;
  closed: boolean;
  expected: number;
  present: number;
  remaining: number;
};
export type StudentAttendancePool = Pick<
  AttendancePool,
  "id" | "title" | "place" | "endsAt"
>;
export type StaffAttendanceSession = {
  id: string;
  contextType: AttendanceContext | "pool" | "night";
  contextId: string;
  title: string;
  sessionDate: string;
  expected: number | null;
  present: number;
  absent: number;
  late: number;
  excused: number;
  unmarked: number | null;
};
export type AttendanceDailyOverview = {
  day: string;
  startsAt: string;
  resetsAt: string;
  timeZone: string;
  sessions: number;
  present: number;
  absent: number;
  late: number;
  unmarked: number;
  excused: number;
};
export type StaffAttendanceProfile = {
  studentId: string;
  name: string;
  schoolName: string;
  classNames: string[];
  points: number;
  /** Percentage of the visible student's recorded attendance that is present or late. */
  attendanceRate: number | null;
  /** Percentage of eligible sessions that have an attendance record. */
  attendanceCoverage: number | null;
  totalSessions: number;
  scopedToTeacherClasses: boolean;
  counts: { present: number; absent: number; late: number; excused: number };
  records: Array<{
    id: string;
    sessionId: string;
    title: string;
    contextType: StaffAttendanceSession["contextType"];
    sessionDate: string;
    status: PhysicalAttendanceStatus | "excused";
    note: string;
  }>;
};
/** Attendance history and coins for one student in a teacher's class/book assignment. */
export type TeacherStudentClassAttendanceProfile = {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  bookId: string;
  bookName: string;
  teacherName: string;
  totalCoins: number;
  totalSessions: number;
  counts: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    unmarked: number;
  };
  sessions: Array<{
    sessionId: string;
    sessionDate: string;
    title: string;
    status: PhysicalAttendanceStatus | "excused" | "unmarked";
    note: string;
    coins: number;
  }>;
};
export type AttendanceEncouragement = {
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number | null;
  points: number;
  message: string;
};
export type AttendanceMissingMember = Pick<
  AttendanceRosterMember,
  "id" | "name"
> & {
  status: "absent" | "excused" | "unmarked";
};
