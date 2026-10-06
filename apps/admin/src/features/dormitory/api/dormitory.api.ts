import { api } from "../../../shared/api/api";

export type DormRoom = {
  id: string;
  organizationId: string;
  organizationName?: string;
  code: string;
  name: string;
  capacity: number;
  status: "ACTIVE" | "ARCHIVED";
  studentCount: number;
};

export type DormAssignment = {
  id: string;
  studentId: string;
  name: string;
  nationalCode?: string | null;
  userId?: string | null;
};

export const listDormRooms = (organizationId?: string) =>
  api.get<DormRoom[]>(`/dormitory/rooms${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`);

export const createDormRoom = (body: { organizationId: string; code: string; name: string; capacity?: number }) =>
  api.post<DormRoom>("/dormitory/rooms", body);

export const listDormAssignments = (roomId: string) =>
  api.get<DormAssignment[]>(`/dormitory/rooms/${encodeURIComponent(roomId)}/assignments`);

export const setDormAssignments = (roomId: string, studentIds: string[]) =>
  api.put<{ roomId: string; count: number }>(`/dormitory/rooms/${encodeURIComponent(roomId)}/assignments`, { studentIds });
