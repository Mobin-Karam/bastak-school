import { api } from "../../../shared/api/api";

export type EducationClassBook = {
  id: string;
  bookId: string;
  title: string;
  category: string;
  teacher: { id: string; name: string };
};
export type EducationClassStudent = { id: string; name: string; grade: string; major: string };
export type EducationClass = {
  id: string;
  organization: { id: string; name: string };
  code: string;
  name: string;
  schoolYear: string;
  gradeId: number;
  educationTypeId: string;
  trackId: string;
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
  gradeId: number;
  educationTypeId: string;
  trackId: string;
  capacity: number;
  description: string;
  advisorId?: string | null;
};

export const listClasses = (organizationId?: string) =>
  api.get<EducationClass[]>(
    `/classes${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ""}`,
  );
export const createClass = (body: ClassDraft) => api.post<EducationClass>("/classes", body);
export const updateClass = (
  id: string,
  body: Partial<ClassDraft & { status: EducationClass["status"] }>,
) => api.patch<EducationClass>(`/classes/${encodeURIComponent(id)}`, body);
export const deleteClass = (id: string) => api.delete(`/classes/${encodeURIComponent(id)}`);
export const getClassOptions = (id: string) =>
  api.get<ClassOptions>(`/classes/${encodeURIComponent(id)}/options`);
export const setClassBooks = (id: string, books: Array<{ bookId: string; teacherId: string }>) =>
  api.put<EducationClass>(`/classes/${encodeURIComponent(id)}/books`, { books });
export const setClassEnrollments = (id: string, studentIds: string[]) =>
  api.put<EducationClass>(`/classes/${encodeURIComponent(id)}/enrollments`, { studentIds });
