import { api } from "../../../../shared/api/api";

export type ExitPermissionStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "COMPLETED";

export type ExitPermission = {
  id: string;
  organizationId: string;
  organizationName: string;
  studentId: string;
  studentName: string;
  destination: string;
  reason: string;
  requestedDepartureAt: string;
  expectedReturnAt: string | null;
  actualDepartureAt: string | null;
  actualReturnAt: string | null;
  returnRequestedAt: string | null;
  returnRequestNote: string;
  returnVerifiedById: string | null;
  returnVerifiedAt: string | null;
  note: string;
  status: ExitPermissionStatus;
  approverId: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type SchoolOccupancy = {
  organizationId: string;
  totalStudents: number;
  currentlyOut: number;
  currentlyInSchool: number;
  generatedAt: string;
};

export const listExitPermissions = (organizationId?: string) =>
  api.get<ExitPermission[]>(
    `/exit-permissions${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );

export const reviewExitPermission = (
  id: string,
  status: Extract<ExitPermissionStatus, "APPROVED" | "REJECTED">,
  note?: string,
) => api.patch<ExitPermission>(`/exit-permissions/${encodeURIComponent(id)}`, { status, note });

export const recordDeparture = (id: string) =>
  api.post<ExitPermission>(`/exit-permissions/${encodeURIComponent(id)}/departure`, {});

export const recordReturn = (id: string) =>
  api.post<ExitPermission>(`/exit-permissions/${encodeURIComponent(id)}/return`, {});

export const requestReturn = (id: string, note?: string) =>
  api.post<ExitPermission>(`/student/exit-permissions/${encodeURIComponent(id)}/return-request`, {
    note,
  });

export const recordGateDeparture = (input: {
  organizationId: string;
  phoneNumber: string;
  destination?: string;
  reason?: string;
  expectedReturnAt?: string;
}) => api.post<ExitPermission>("/exit-permissions/gate-departure", input);

export const recordGateReturn = (input: {
  organizationId: string;
  phoneNumber: string;
  note?: string;
}) => api.post<ExitPermission>("/exit-permissions/gate-return", input);

export const getSchoolOccupancy = (organizationId?: string) =>
  api.get<SchoolOccupancy[]>(
    `/attendance/occupancy${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );
