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

export const listDormRooms = (organizationId?: string, includeArchived = false) =>
  api.get<DormRoom[]>(
    `/dormitory/rooms?${new URLSearchParams({
      ...(organizationId ? { organizationId } : {}),
      ...(includeArchived ? { includeArchived: "true" } : {}),
    }).toString()}`,
  );

export const createDormRoom = (body: {
  organizationId: string;
  code: string;
  name: string;
  building?: string;
  floor?: number;
  capacity?: number;
}) => api.post<DormRoom>("/dormitory/rooms", body);

export const updateDormRoom = (
  roomId: string,
  body: Partial<Pick<DormRoom, "code" | "name" | "building" | "floor" | "capacity">>,
) => api.patch<DormRoom>(`/dormitory/rooms/${encodeURIComponent(roomId)}`, body);

export const archiveDormRoom = (roomId: string) =>
  api.delete<{ roomId: string; status: "ARCHIVED" }>(
    `/dormitory/rooms/${encodeURIComponent(roomId)}`,
  );

export const restoreDormRoom = (roomId: string) =>
  api.post<{ roomId: string; status: "ACTIVE" }>(
    `/dormitory/rooms/${encodeURIComponent(roomId)}/restore`,
    {},
  );

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
