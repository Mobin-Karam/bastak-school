import { api } from "../../../shared/api/api";

export const getStudentActivity = (id: string, limit = 300) =>
  api.get<unknown[]>(`/students/${id}/activity?limit=${limit}`);

export const getStudentWeeklyProgress = (id: string) =>
  api.get<Record<string, unknown>>(`/students/${id}/progress/weekly`);

export const getStudentTopicPerformance = (id: string) =>
  api.get<unknown[]>(`/students/${id}/performance/topics?limit=20`);

export type StudentSyncHealth = {
  deviceId: string;
  correlationId: string | null;
  status: "online" | "syncing" | "failed" | "offline";
  pendingCount: number;
  failureCode: string | null;
  lastSuccessfulAt: string | null;
  updatedAt: string;
};
export const getStudentSyncHealth = (id: string) =>
  api.get<StudentSyncHealth[]>(`/students/${id}/sync-health`);
export const reviewStudentSyncHealth = (id: string) =>
  api.post<{ reviewed: boolean }>(`/students/${id}/sync-health/review`, {});
