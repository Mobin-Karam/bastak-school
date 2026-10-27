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
};
export const getTeacherStudentReports = () =>
  api.get<TeacherStudentReport[]>("/principal/teacher-reports");
export const markTeacherStudentReportSeen = (id: string) =>
  api.patch<{ id: string; seenAt: string }>(
    `/principal/teacher-reports/${encodeURIComponent(id)}/seen`,
    {},
  );
