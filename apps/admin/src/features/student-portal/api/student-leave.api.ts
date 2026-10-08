import { api } from "../../../shared/api/api";

export type StudentLeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
export type StudentLeaveType = "SCHOOL_EXIT" | "LEAVE";
export type StudentLeaveReviewerRole = "SCHOOL_SUPERVISOR" | "PRINCIPAL";

export type StudentLeaveRequest = {
  id: string;
  organizationId: string;
  organizationName: string;
  leaveType: StudentLeaveType;
  reviewerRole: StudentLeaveReviewerRole;
  startDate: string;
  endDate: string;
  reason: string;
  note: string;
  status: StudentLeaveStatus;
  createdAt: string;
};

export const listStudentLeaveRequests = () =>
  api.get<StudentLeaveRequest[]>("/student/leave-requests");

export const createStudentLeaveRequest = (body: {
  organizationId: string;
  leaveType: StudentLeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  note?: string;
}) => api.post<StudentLeaveRequest>("/student/leave-requests", body);
