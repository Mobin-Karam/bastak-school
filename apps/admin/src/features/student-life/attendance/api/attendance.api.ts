import { api } from "../../../../shared/api/api";

export type AttendanceContextType = "class" | "class_group" | "dorm";

export type AttendanceSessionSummary = {
  id: string;
  contextType: AttendanceContextType | "pool" | "night";
  contextId: string;
  contextLabel: string;
  sessionDate: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  remaining: number | null;
};

export type AttendanceContextOption = {
  id: string;
  contextType: AttendanceContextType;
  code: string;
  name: string;
  label: string;
  total: number;
  activeOrganizationId?: string;
  classId?: string;
  building?: string;
  floor?: number;
};

export const contextLabelMap: Record<AttendanceContextType | "pool" | "night", string> = {
  class: "کلاس",
  class_group: "گروه کلاس",
  dorm: "خوابگاه",
  pool: "حوضچه / فراخوان",
  night: "حضور شب",
};

export const listAttendanceSessions = () =>
  api.get<AttendanceSessionSummary[]>("/student/attendance/sessions");

export const listAttendanceContexts = (organizationId?: string) =>
  api.get<AttendanceContextOption[]>(
    `/attendance/contexts${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );

export const getAttendanceParticipants = (contextType: AttendanceContextType, contextId: string) =>
  api.get<
    Array<{ id: string; name: string; userId?: string | null; nationalCode?: string | null }>
  >(
    `/attendance/context/${encodeURIComponent(contextType)}/${encodeURIComponent(contextId)}/participants`,
  );

export type AttendanceBulkMarkRequest = {
  expectedRevision?: number;
  requestId?: string;
  organizationId: string;
  sessionId?: string;
  contextType?: AttendanceContextType;
  contextId?: string;
  sessionDate?: string;
  entries: Array<{
    studentId: string;
    status: "present" | "absent" | "late" | "excused";
    note?: string;
  }>;
};

export const bulkMarkAttendance = (body: AttendanceBulkMarkRequest) =>
  api.post<{ sessionId: string; count: number }>("/attendance/bulk-mark", body);

export type AttendanceAbsenceReview = {
  id: string;
  studentId: string;
  studentName: string;
  status: "present" | "absent" | "late" | "excused";
  reason: string;
  reviewStatus: "pending" | "approved" | "rejected" | null;
  reviewNote: string;
  reviewedAt: string | null;
  sessionDate: string;
  contextType: AttendanceContextType;
  contextId: string;
  organizationId: string;
  organizationName: string;
  teacherName: string;
};

export const listAttendanceAbsenceReviews = (organizationId?: string) =>
  api.get<AttendanceAbsenceReview[]>(
    `/attendance/absence-reviews${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );

export const listLiveAttendanceRecords = (organizationId?: string) =>
  api.get<AttendanceAbsenceReview[]>(
    `/attendance/live-records${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );

export const reviewAttendanceAbsence = (
  id: string,
  body: { decision: "approved" | "rejected"; note?: string },
) =>
  api.patch<AttendanceAbsenceReview>(`/attendance/absence-reviews/${encodeURIComponent(id)}`, body);

export const listMyAttendanceAbsenceReviews = () =>
  api.get<AttendanceAbsenceReview[]>("/attendance/my-absence-reviews");

export type SelfAttendanceRecord = {
  id: string;
  sessionId?: string;
  status: "present" | "absent" | "late" | "excused";
  physicalStatus?: "present" | "absent" | "late" | "legacy_unknown";
  reviewStatus?: "pending" | "approved" | "rejected" | null;
  note: string;
  sessionDate: string;
  contextType: AttendanceContextType;
  contextId: string;
  organizationId: string;
  recordedAt: string;
};

export type SelfAttendanceSummary = {
  studentId: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  recent: SelfAttendanceRecord[];
};

export const listSelfAttendance = () => api.get<SelfAttendanceRecord[]>("/student/attendance");
export const getSelfAttendanceSummary = () =>
  api.get<SelfAttendanceSummary>("/student/attendance-summary");
