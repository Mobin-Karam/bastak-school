import { api } from "../../../../shared/api/api";
export type ReportRow = Record<string, unknown>;
export function getReports(studentId: string, from: string, to: string) {
  return api.get<ReportRow[]>(`/students/${studentId}/reports?from=${from}&to=${to}`);
}
export type TeacherStudentReport = {
  id: string;
  message: string;
  createdAt: string;
  seenAt: string | null;
  studentId: string;
  studentName: string;
  teacherName: string;
  sessionId: string;
  sessionTitle: string;
  seenByName: string | null;
  principalAction: "full_screen_summons" | "contact_request" | null;
  principalActionNote: string;
  principalActionAt: string | null;
};
export const getTeacherStudentReports = () =>
  api.get<TeacherStudentReport[]>("/principal/teacher-reports");
export const getMyTeacherStudentReports = () =>
  api.get<TeacherStudentReport[]>("/teacher/student-reports");
export const markTeacherStudentReportSeen = (id: string) =>
  api.patch<{ id: string; seenAt: string }>(
    `/principal/teacher-reports/${encodeURIComponent(id)}/seen`,
    {},
  );
export const actOnTeacherStudentReport = (
  id: string,
  action: "full_screen_summons" | "contact_request",
  note?: string,
) =>
  api.patch<{ id: string; action: string; actionAt: string }>(
    `/principal/teacher-reports/${encodeURIComponent(id)}/action`,
    { action, note },
  );
