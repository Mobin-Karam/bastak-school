import { api } from "../../../../shared/api/api";

export type DormRoom = {
  id: string;
  organizationId: string;
  organizationName?: string;
  code: string;
  name: string;
  building: string;
  floor: number;
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
  api.get<DormRoom[]>(
    `/dormitory/rooms${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );

export const createDormRoom = (body: {
  organizationId: string;
  code: string;
  name: string;
  building?: string;
  floor?: number;
  capacity?: number;
}) => api.post<DormRoom>("/dormitory/rooms", body);

export const listDormAssignments = (roomId: string) =>
  api.get<DormAssignment[]>(`/dormitory/rooms/${encodeURIComponent(roomId)}/assignments`);

export const listAvailableDormStudents = (roomId: string) =>
  api.get<Array<{ id: string; name: string }>>(
    `/dormitory/rooms/${encodeURIComponent(roomId)}/available-students`,
  );

export const setDormAssignments = (roomId: string, studentIds: string[]) =>
  api.put<{ roomId: string; count: number }>(
    `/dormitory/rooms/${encodeURIComponent(roomId)}/assignments`,
    { studentIds },
  );

export type DormitoryStudent = {
  id: string;
  name: string;
  phoneNumber: string | null;
  hasAccount: boolean;
};
export const findDormitoryStudents = (organizationId: string, query: string) =>
  api.get<DormitoryStudent[]>(
    `/dormitory/students?organizationId=${encodeURIComponent(organizationId)}&q=${encodeURIComponent(query)}`,
  );
export const sendDormitoryAnnouncement = (body: {
  organizationId: string;
  title: string;
  body: string;
  target: "ROOM" | "STUDENT";
  roomId?: string;
  studentId?: string;
}) => api.post<{ delivered: number }>("/dormitory/announcements", body);
