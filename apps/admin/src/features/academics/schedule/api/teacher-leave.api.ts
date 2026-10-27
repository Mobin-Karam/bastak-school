import { api } from "../../../../shared/api/api";

export type TeacherLeaveRequest = {
  id: string;
  organizationId: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  resolution: "cancel" | "substitute" | null;
  substituteTeacherId: string | null;
  reviewedAt: string | null;
  teacher?: { id: string; username: string; firstName?: string; lastName?: string } | null;
  substituteTeacher?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  } | null;
};
export const listTeacherLeaveRequests = () =>
  api.get<TeacherLeaveRequest[]>("/schedule/teacher-leave-requests");
export const createTeacherLeaveRequest = (body: {
  organizationId: string;
  startDate: string;
  endDate: string;
  reason: string;
}) => api.post<TeacherLeaveRequest>("/schedule/teacher-leave-requests", body);
export const reviewTeacherLeaveRequest = (
  id: string,
  body: {
    decision: "approved" | "rejected";
    resolution?: "cancel" | "substitute";
    substituteTeacherId?: string;
  },
) => api.post<TeacherLeaveRequest>(`/schedule/teacher-leave-requests/${id}/review`, body);
