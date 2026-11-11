import type { AcademicPage, AcademicEnrollmentHistory } from "@moshaver/api-contract";
import { api } from "../../../../shared/api/api";

export type EducationClassBook = {
  id: string;
  bookId: string;
  title: string;
  code: string;
  teacher: { id: string; name: string };
};
export type EducationClassStudent = {
  id: string;
  name: string;
  grade: string;
  major: string;
  phoneNumber?: string | null;
};
export type EducationClass = {
  id: string;
  organization: { id: string; name: string; type?: string; status?: string };
  code: string;
  name: string;
  schoolYear: string;
  academicYearId?: string | null;
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
  academicYearId?: string;
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

export const getClassEnrollmentHistory = (id: string, offset = 0, limit = 50) =>
  api.get<AcademicPage<AcademicEnrollmentHistory>>(
    `/classes/${encodeURIComponent(id)}/enrollments/history?offset=${offset}&limit=${limit}`,
  );

export type ClassBookGrade = {
  id: string;
  studentId: string;
  score: number;
  note: string;
  principalEdited: boolean;
  principalEditedAt: string | null;
  updatedAt: string;
};
export type ClassBookGrades = {
  classBookId: string;
  className: string;
  bookTitle: string;
  teacher: { id: string; name: string; username: string };
  students: Array<{ id: string; name: string }>;
  sessions: Array<{
    id: string;
    title: string;
    heldOn: string;
    description: string;
    grades: ClassBookGrade[];
  }>;
};
export type MyClassBookGrade = ClassBookGrade & {
  sessionTitle: string;
  heldOn: string;
  className: string;
  schoolYear: string;
  bookTitle: string;
  teacherName: string;
};
export const getClassBookGrades = (id: string) =>
  api.get<ClassBookGrades>(`/class-books/${encodeURIComponent(id)}/grades`);
export const createClassBookGradeSession = (
  id: string,
  body: { title: string; heldOn: string; description?: string },
) =>
  api.post<ClassBookGrades["sessions"][number]>(
    `/class-books/${encodeURIComponent(id)}/grade-sessions`,
    body,
  );
export const updateClassBookGradeSession = (
  id: string,
  sessionId: string,
  body: { title?: string; heldOn?: string; description?: string },
) =>
  api.patch<ClassBookGrades["sessions"][number]>(
    `/class-books/${encodeURIComponent(id)}/grade-sessions/${encodeURIComponent(sessionId)}`,
    body,
  );
export const deleteClassBookGradeSession = (id: string, sessionId: string) =>
  api.delete(
    `/class-books/${encodeURIComponent(id)}/grade-sessions/${encodeURIComponent(sessionId)}`,
  );
export const saveClassBookGrade = (
  id: string,
  sessionId: string,
  body: { studentId: string; score: number; note: string },
) =>
  api.put<ClassBookGrade>(
    `/class-books/${encodeURIComponent(id)}/grade-sessions/${encodeURIComponent(sessionId)}/grades`,
    body,
  );
export const deleteClassBookGrade = (id: string, sessionId: string, studentId: string) =>
  api.delete(
    `/class-books/${encodeURIComponent(id)}/grade-sessions/${encodeURIComponent(sessionId)}/grades/${encodeURIComponent(studentId)}`,
  );
export type BookAttendancePage = {
  page: number;
  total: number;
  hasNext: boolean;
  items: Array<{
    id: string;
    title: string;
    date: string;
    status: string;
    records: Array<{ studentId: string; status: string }>;
  }>;
};
export const getClassBookAttendance = (id: string, page = 1) =>
  api.get<BookAttendancePage>(
    `/class-books/${encodeURIComponent(id)}/attendance-sessions?page=${page}`,
  );
export const getMyClassBookGrades = () => api.get<MyClassBookGrade[]>("/class-grades/mine");
