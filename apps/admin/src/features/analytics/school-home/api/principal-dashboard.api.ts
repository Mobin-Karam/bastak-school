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
    mode: "all_sessions" | "absences_only";
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
  principalLists?: {
    counts?: { dorm: number; reports: number; leave: number; groups: number };
    teacherSessions: Array<{
      id: string;
      title: string;
      teacherName: string;
      sessionDate: string;
      present: number;
      absent: number;
      marked: number;
    }>;
    teacherReports: Array<{
      id: string;
      teacherName: string;
      studentName: string;
      message: string;
      createdAt: string;
      seenAt: string | null;
    }>;
    dormAttendance: Array<{
      id: string;
      name: string;
      total: number;
      present: number;
      absent: number;
    }>;
    classGroupAttendance: Array<{
      id: string;
      name: string;
      total: number;
      present: number;
      absent: number;
      sessionDate: string;
    }>;
    teacherLeaveRequests: Array<{
      id: string;
      teacherName: string;
      type: "leave" | "return";
      startDate: string;
      endDate: string;
      status: "pending";
    }>;
  };
};

export const getPrincipalDashboard = (range: "7d" | "30d", classId?: string) => {
  const to = todayIso();
  const from = addDays(to, range === "30d" ? -30 : -6);
  const query = new URLSearchParams({ from, to });
  if (classId) query.set("classId", classId);
  return api.get<PrincipalDashboardContract>(`/dashboard/principal?${query.toString()}`);
};

export const reviewAttendanceSession = (sessionId: string, message?: string) =>
  api.post<{ sessionId: string; reviewedAt: string }>(
    `/attendance/sessions/${encodeURIComponent(sessionId)}/daily-review`,
    { message },
  );

export const getAttendanceSessionForReview = (sessionId: string) =>
  api.get<AttendanceSessionDetail>(`/attendance/sessions/${encodeURIComponent(sessionId)}`);

export const getReviewablePresentSessions = (organizationId?: string) => {
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : "";
  return api.get<Array<{ id: string; revision: number }>>(
    `/attendance/reviewable-present-sessions${query}`,
  );
};
