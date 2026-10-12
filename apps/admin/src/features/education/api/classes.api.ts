import { api } from "../../../shared/api/api";

export type EducationClassBook = {
  id: string;
  bookId: string;
  title: string;
  code: string;
  teacher: { id: string; name: string };
};
export type EducationClassStudent = { id: string; name: string; grade: string; major: string };
export type EducationClass = {
  id: string;
  organization: { id: string; name: string; type?: string; status?: string };
  code: string;
  name: string;
  schoolYear: string;
  gradeId: number | null;
  educationTypeId: string | null;
  trackId: string | null;
  capacity: number;
  status: "ACTIVE" | "ARCHIVED";
  description: string;
  advisor: { id: string; name: string } | null;
  books: EducationClassBook[];
  enrollmentCount: number;
  students: EducationClassStudent[];
};
export type ClassOptions = {
  classroom: EducationClass;
  books: Array<{ id: string; title: string; category: string; track: string }>;
  teachers: Array<{ id: string; name: string; roles: string[] }>;
  advisors: Array<{ id: string; name: string; roles: string[] }>;
  eligibleStudents: EducationClassStudent[];
};
export type ClassDraft = {
  organizationId: string;
  code: string;
  name: string;
  schoolYear: string;
  capacity: number;
};
export type ClassTransferRow = Pick<ClassDraft, "code" | "name" | "schoolYear" | "capacity">;
export type ClassTransferPreview = {
  total: number;
  valid: number;
  invalid: number;
  rows: Array<ClassTransferRow & { row: number; errors: string[] }>;
};

export type ClassUpdate = Partial<ClassDraft> & {
  advisorId?: string | null;
  description?: string;
  status?: EducationClass["status"];
};

export const listClasses = (organizationId?: string) =>
  api.get<EducationClass[]>(
    `/classes${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );
export const createClass = (body: ClassDraft) => api.post<EducationClass>("/classes", body);
export const updateClass = (id: string, body: ClassUpdate) =>
  api.patch<EducationClass>(`/classes/${encodeURIComponent(id)}`, body);
export const deleteClass = (id: string) => api.delete(`/classes/${encodeURIComponent(id)}`);
export const getClassOptions = (id: string) =>
  api.get<ClassOptions>(`/classes/${encodeURIComponent(id)}/options`);
export const setClassBooks = (id: string, books: Array<{ bookId: string; teacherId: string }>) =>
  api.put<EducationClass>(`/classes/${encodeURIComponent(id)}/books`, { books });
export const setClassEnrollments = (id: string, studentIds: string[]) =>
  api.put<EducationClass>(`/classes/${encodeURIComponent(id)}/enrollments`, { studentIds });
export const previewClassTransfer = (organizationId: string, rows: ClassTransferRow[]) =>
  api.post<ClassTransferPreview>("/classes/transfer/preview", { organizationId, rows });
export const commitClassTransfer = (organizationId: string, rows: ClassTransferRow[]) =>
  api.post<{ committed: boolean; count: number; invalid: number }>("/classes/transfer/commit", {
    organizationId,
    rows,
  });
export const exportClassTransfer = (organizationId: string) =>
  api.get<ClassTransferRow[]>(
    `/classes/transfer/export?organizationId=${encodeURIComponent(organizationId)}`,
  );

export const addClassBook = (id: string, bookId: string, teacherId: string) =>
  api.post<EducationClass>(`/classes/${encodeURIComponent(id)}/books`, { bookId, teacherId });
