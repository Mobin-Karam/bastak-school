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
  returnDate: string | null;
  returnMessage: string | null;
  returnStatus: "pending" | "approved" | "rejected" | null;
  returnRequestedAt: string | null;
  returnReviewedAt: string | null;
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
export const requestTeacherLeaveReturn = (
  id: string,
  body: { returnDate: string; returnMessage?: string },
) => api.post<TeacherLeaveRequest>(`/schedule/teacher-leave-requests/${id}/return`, body);
export const reviewTeacherLeaveReturn = (id: string, body: { decision: "approved" | "rejected" }) =>
  api.post<TeacherLeaveRequest>(`/schedule/teacher-leave-requests/${id}/return/review`, body);
