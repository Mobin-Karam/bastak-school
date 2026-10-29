import { api } from "../../../../shared/api/api";
import type {
  AttendanceDailyOverview,
  AttendanceEncouragement,
  AttendancePool,
  AttendancePoolDraft,
  AttendanceSessionDetail,
  DormAttendanceAssignment,
  DormAttendanceDelegate,
  DormAttendanceWrite,
  DormDelegateDraft,
  StaffAttendanceProfile,
  StaffAttendanceSession,
  StudentAttendancePool,
  TeacherStudentClassAttendanceProfile,
} from "@moshaver/api-contract";

export const getAttendanceOverview = () => api.get<AttendanceDailyOverview>("/attendance/overview");
export const getAttendanceReportSummary = (params?: {
  from?: string;
  to?: string;
  academicYearId?: string;
  termId?: string;
}) => {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", `${params.from}T00:00:00.000Z`);
  if (params?.to) search.set("to", `${params.to}T23:59:59.999Z`);
  if (params?.academicYearId) search.set("academicYearId", params.academicYearId);
  if (params?.termId) search.set("termId", params.termId);
  const suffix = search.size ? `?${search.toString()}` : "";
  return api.get<{
    from: string | null;
    to: string | null;
    academicYearId: string | null;
    termId: string | null;
    finalizedSessions: number;
    denominator: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number | null;
  }>(`/attendance/reports/summary${suffix}`);
};
export type AttendancePolicy = {
  organizationId: string;
  timeZone: string;
  dayStartsAt: string;
  allowPartialSubmission: boolean;
  lateCountsAsPresent: boolean;
  correctionRequiresReview: boolean;
  principalReviewMode: "all_sessions" | "absences_only";
};
export const getAttendancePolicy = () => api.get<AttendancePolicy>("/attendance/policy");
export const updateAttendancePolicy = (body: AttendancePolicy) =>
  api.patch<AttendancePolicy>("/attendance/policy", body);
export type StaffAttendanceSessionPage = {
  items: StaffAttendanceSession[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};
export type AttendanceHistorySession = {
  id: string;
  organizationId: string;
  contextType: "class" | "class_group" | "dorm";
  contextId: string;
  title: string;
  teacherName: string | null;
  subjectId: string | null;
  subjectName: string | null;
  status: "scheduled" | "open" | "submitted" | "finalized" | "cancelled";
  revision: number;
  academicYearId: string | null;
  academicYearName: string | null;
  termId: string | null;
  termName: string | null;
  sessionDate: string;
  marked: number;
  expected: number | null;
  present: number;
  absent: number;
  late: number;
  excused: number;
  unmarked: number | null;
};
export type AttendanceHistorySessionPage = {
  items: AttendanceHistorySession[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};
export type AttendanceHistorySessionFilters = {
  page?: number;
  limit?: number;
  contextType?: "class" | "class_group" | "dorm";
  contextId?: string;
  academicYearId?: string;
  termId?: string;
};
export type HistoricalAttendanceCandidate = {
  entryId: string;
  date: string;
  title: string;
  classroomId: string;
  classroomName: string;
  teacherName: string;
  subjectName: string | null;
  startTime: string;
  endTime: string;
};
export const getHistoricalAttendanceCandidates = (params: {
  organizationId: string;
  academicYearId: string;
  termId: string;
  classroomId?: string;
  from?: string;
  to?: string;
}) =>
  api.get<HistoricalAttendanceCandidate[]>(
    `/attendance/historical-candidates?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => Boolean(value)) as Array<[string, string]>,
    ).toString()}`,
  );
export const importLegacyScheduleOccurrence = (body: { entryId: string; date: string }) =>
  api.post<{ id: string; revision: number; duplicate: boolean }>(
    "/attendance/legacy-schedule-session",
    body,
  );
export const createHistoricalAttendanceSession = (body: {
  organizationId: string;
  academicYearId: string;
  termId: string;
  classroomId: string;
  teacherId?: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  date: string;
  reason: string;
}) =>
  api.post<{ id: string; revision: number; duplicate: boolean }>(
    "/attendance/historical-sessions",
    body,
  );
export const getAttendanceHistorySessions = (filters: AttendanceHistorySessionFilters = {}) => {
  const search = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 25),
  });
  if (filters.contextType) search.set("contextType", filters.contextType);
  if (filters.contextId) search.set("contextId", filters.contextId);
  if (filters.academicYearId) search.set("academicYearId", filters.academicYearId);
  if (filters.termId) search.set("termId", filters.termId);
  return api.get<AttendanceHistorySessionPage>(`/attendance/history/sessions?${search.toString()}`);
};
export const getSavedAttendanceSession = (id: string) =>
  api.get<AttendanceSessionDetail>(`/attendance/sessions/${encodeURIComponent(id)}`);
export const submitAttendanceAbsences = (
  id: string,
  body: {
    requestId: string;
    expectedRevision: number;
    absentStudentIds: string[];
    lateStudentIds?: string[];
    excusedStudentIds?: string[];
  },
) =>
  api.post<{ sessionId: string; revision: number; status: string; count: number }>(
    `/attendance/sessions/${encodeURIComponent(id)}/submit-absences`,
    body,
  );
export const finalizeAttendanceSession = (
  id: string,
  body: { requestId: string; expectedRevision: number },
) =>
  api.post<{ sessionId: string; revision: number; status: "finalized" }>(
    `/attendance/sessions/${encodeURIComponent(id)}/finalize`,
    body,
  );
export const cancelAttendanceSession = (
  id: string,
  body: { requestId: string; expectedRevision: number; reason: string },
) =>
  api.post<{ sessionId: string; revision: number; status: "cancelled" }>(
    `/attendance/sessions/${encodeURIComponent(id)}/cancel`,
    body,
  );
export const correctAttendanceRecord = (
  id: string,
  body: {
    requestId: string;
    expectedRevision: number;
    status: "present" | "absent" | "late" | "excused";
    reason: string;
    minutesLate?: number;
  },
) =>
  api.patch<{
    recordId: string;
    revision: number;
    sessionRevision: number;
    correctionId?: string;
    pendingReview?: boolean;
  }>(`/attendance/records/${encodeURIComponent(id)}/correction`, body);
export type PendingAttendanceCorrection = {
  id: string;
  recordId: string;
  sessionId: string;
  organizationId: string;
  contextType: "class" | "class_group" | "dorm";
  contextId: string;
  title: string;
  studentId: string;
  studentName: string;
  requestedBy: string;
  reason: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  createdAt: string;
};
export const getPendingAttendanceCorrections = () =>
  api.get<PendingAttendanceCorrection[]>("/attendance/corrections/pending");
export const reviewAttendanceCorrection = (
  id: string,
  body: { requestId: string; decision: "approved" | "rejected"; note?: string },
) =>
  api.post<{ correctionId: string; status: "approved" | "rejected" }>(
    `/attendance/corrections/${encodeURIComponent(id)}/review`,
    body,
  );
export const getAttendanceProfile = (id: string) =>
  api.get<StaffAttendanceProfile>(`/attendance/students/${encodeURIComponent(id)}/profile`);
export const getTeacherStudentClassProfile = (studentId: string, entryId: string) =>
  api.get<TeacherStudentClassAttendanceProfile>(
    `/attendance/teacher-students/${encodeURIComponent(studentId)}/class-profile?entryId=${encodeURIComponent(entryId)}`,
  );
export const getDormDelegates = () => api.get<DormAttendanceDelegate[]>("/attendance/delegates");
export const setDormDelegate = (roomId: string, body: DormDelegateDraft) =>
  api.put<DormAttendanceDelegate>(`/attendance/dorm/${encodeURIComponent(roomId)}/delegate`, body);
export const revokeDormDelegate = (roomId: string) =>
  api.delete<{ revoked: boolean }>(`/attendance/dorm/${encodeURIComponent(roomId)}/delegate`);
export const getAttendancePools = () => api.get<AttendancePool[]>("/attendance/pools");
export const createAttendancePool = (body: AttendancePoolDraft) =>
  api.post<AttendancePool>("/attendance/pools", body);
export const closeAttendancePool = (id: string) =>
  api.post<{ closed: boolean }>(`/attendance/pools/${encodeURIComponent(id)}/close`, {});
export const getAttendanceEncouragement = () =>
  api.get<AttendanceEncouragement>("/student/attendance/encouragement");
export const awardAttendancePoints = (body: {
  requestId: string;
  organizationId: string;
  contextType: "class" | "class_group" | "dorm";
  contextId: string;
  studentId: string;
  points: number;
  reason: string;
}) =>
  api.post<{ id: string; studentId: string; points: number; reason: string }>(
    "/attendance/points",
    body,
  );
export const getMyDormAssignments = () =>
  api.get<DormAttendanceAssignment[]>("/student/attendance/dorm-assignments");
export const markDelegatedDormAttendance = (id: string, body: DormAttendanceWrite) =>
  api.post<{ sessionId: string; count: number }>(
    `/student/attendance/dorm-assignments/${encodeURIComponent(id)}/mark`,
    body,
  );
export const getMyAttendancePools = () =>
  api.get<StudentAttendancePool[]>("/student/attendance/pools");
export const confirmAttendancePool = (id: string) =>
  api.post<{ confirmed: boolean }>(`/student/attendance/pools/${encodeURIComponent(id)}/check-in`, {
    confirmation: "here",
  });

export const getDormResidents = () =>
  api.get<Array<{ id: string; name: string; userId: string; organizationId: string }>>(
    "/attendance/dorm-residents",
  );
export const setDormWideDelegate = (body: DormDelegateDraft) =>
  api.put<DormAttendanceDelegate[]>("/attendance/dorm/delegate-all", body);

export const revokeDormWideDelegate = () =>
  api.delete<{ revoked: boolean }>("/attendance/dorm/delegate-all");

export const getAttendanceSessionHistory = (id: string) =>
  api.get<Array<{ id: string; action: string; createdAt: string }>>(
    `/attendance/sessions/${encodeURIComponent(id)}/history`,
  );
