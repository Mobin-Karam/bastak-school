import { api } from "../../../../shared/api/api";
import { addDays, todayIso } from "../../../../shared/lib/utils";
import type { AttendanceSessionDetail } from "@moshaver/api-contract";

export type PrincipalDashboardContract = {
  organizationId: string;
  generatedAt: string;
  from: string;
  to: string;
  attendance?: {
    today: { present: number; absent: number; late: number; excused: number; rate: number | null };
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number | null;
    trend: Array<{ date: string; present: number; absent: number; late: number; excused: number }>;
    classes: Array<{
      id: string;
      name: string;
      expected: number;
      marked: number;
      rate: number | null;
    }>;
  };
  behaviour?: {
    dimensions: Array<{ key: string; label: string; value: number | null }>;
    risks: Array<{
      id: string;
      name: string;
      absent: number;
      late: number;
      attention: "high" | "medium";
    }>;
  };
  queues?: {
    attendanceReviews: number;
    leaveRequests: number;
    exitRequests: number;
    permissionRequests: number;
  };
  sessionReviews?: {
    pendingCount: number;
    items: Array<{
      id: string;
      contextType: string;
      contextId: string;
      title: string;
      sessionDate: string;
      status: string;
      expected: number | null;
      marked: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      lastReviewedAt: string | null;
    }>;
  };
  operations?: {
    activeStudents: number;
    currentlyOut: number;
    scheduleEntries: number;
    staff: number;
  };
  todayAbsences?: Array<{
    id: string;
    name: string;
    context: string;
    sessions: number;
  }>;
  pendingLeaveRequests?: Array<{
    id: string;
    studentName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
  }>;
};

export const getPrincipalDashboard = (range: "7d" | "30d", classId?: string) => {
  const to = todayIso();
  const from = addDays(to, range === "30d" ? -30 : -6);
  const query = new URLSearchParams({ from, to });
  if (classId) query.set("classId", classId);
  return api.get<PrincipalDashboardContract>(`/dashboard/principal?${query.toString()}`);
};

export const reviewAttendanceSession = (sessionId: string) =>
  api.post<{ sessionId: string; reviewedAt: string }>(
    `/attendance/sessions/${encodeURIComponent(sessionId)}/daily-review`,
    {},
  );

export const getAttendanceSessionForReview = (sessionId: string) =>
  api.get<AttendanceSessionDetail>(`/attendance/sessions/${encodeURIComponent(sessionId)}`);
