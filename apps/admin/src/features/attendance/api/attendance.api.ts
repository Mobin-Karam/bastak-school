import { api } from "../../../shared/api/api";

export type AttendanceContextType = "class" | "class_group" | "dorm";

export type AttendanceSessionSummary = {
  id: string;
  contextType: AttendanceContextType;
  contextId: string;
  contextLabel: string;
  sessionDate: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  remaining: number;
};

export type AttendanceContextOption = {
  id: string;
  contextType: AttendanceContextType;
  code: string;
  name: string;
  label: string;
  total: number;
  activeOrganizationId?: string;
};

export const contextLabelMap: Record<AttendanceContextType, string> = {
  class: "کلاس",
  class_group: "گروه کلاس",
  dorm: "خوابگاه",
};

export const listAttendanceSessions = () => api.get<AttendanceSessionSummary[]>("/student/attendance/sessions");

export const listAttendanceContexts = (organizationId?: string) =>
  api.get<AttendanceContextOption[]>(`/attendance/contexts${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`);

export const getAttendanceParticipants = (contextType: AttendanceContextType, contextId: string) =>
  api.get<Array<{ id: string; name: string; userId?: string | null; nationalCode?: string | null }>>(
    `/attendance/context/${encodeURIComponent(contextType)}/${encodeURIComponent(contextId)}/participants`,
  );

export const bulkMarkAttendance = (body: {
  organizationId: string;
  contextType: AttendanceContextType;
  contextId: string;
  sessionDate: string;
  entries: Array<{ studentId: string; status: "present" | "absent" | "late" | "excused"; note?: string }>;
}) => api.post<{ sessionId: string; count: number }>("/attendance/bulk-mark", body);
