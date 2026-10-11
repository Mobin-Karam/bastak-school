import { api } from "../../../shared/api/api";
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
} from "@moshaver/api-contract";

export const getAttendanceOverview = () => api.get<AttendanceDailyOverview>("/attendance/overview");
export const getStaffAttendanceSessions = () =>
  api.get<StaffAttendanceSession[]>("/attendance/staff-sessions");
export const getSavedAttendanceSession = (id: string) =>
  api.get<AttendanceSessionDetail>(`/attendance/sessions/${encodeURIComponent(id)}`);
export const getAttendanceProfile = (id: string) =>
  api.get<StaffAttendanceProfile>(`/attendance/students/${encodeURIComponent(id)}/profile`);
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
