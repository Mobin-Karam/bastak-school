import type {
  AcademicPage,
  AcademicTeachingAssignment,
  AcademicSubjectBookReference,
} from "@moshaver/api-contract";
import { api } from "../../../../shared/api/api";
export type AcademicQuery = {
  offset?: number;
  limit?: number;
  teacherId?: string;
  classroomId?: string;
  academicYearId?: string;
};
export type AcademicSubject = {
  id: string;
  code: string;
  name: string;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
export type AcademicSubjectDraft = Pick<AcademicSubject, "code" | "name"> & { category?: string };
export type AcademicTeacher = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  membershipId?: string;
};
export type TeachingAssignmentDraft = Pick<
  AcademicTeachingAssignment,
  "academicYearId" | "classroomId" | "subjectId" | "teacherId" | "startsOn" | "endsOn"
> & { termId?: string };
const academicQuery = (query: AcademicQuery) =>
  new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
export const listAcademicSubjects = (org: string, page: AcademicQuery = {}) =>
  api.get<AcademicPage<AcademicSubject>>(
    `/school-education/${encodeURIComponent(org)}/subjects?${academicQuery(page)}`,
  );
export const createAcademicSubject = (org: string, body: AcademicSubjectDraft) =>
  api.post<AcademicSubject>(`/school-education/${encodeURIComponent(org)}/subjects`, {
    code: body.code,
    name: body.name,
    category: body.category,
  });
export const listAcademicTeachers = (org: string, page: AcademicQuery = {}) =>
  api.get<AcademicPage<AcademicTeacher>>(
    `/school-education/${encodeURIComponent(org)}/teachers?${academicQuery(page)}`,
  );
export const listTeachingAssignments = (org: string, page: AcademicQuery = {}) =>
  api.get<AcademicPage<AcademicTeachingAssignment>>(
    `/school-education/${encodeURIComponent(org)}/teaching-assignments?${academicQuery(page)}`,
  );
export const createTeachingAssignment = (org: string, body: TeachingAssignmentDraft) =>
  api.post<AcademicTeachingAssignment>(
    `/school-education/${encodeURIComponent(org)}/teaching-assignments`,
    {
      academicYearId: body.academicYearId,
      termId: body.termId,
      classroomId: body.classroomId,
      subjectId: body.subjectId,
      teacherId: body.teacherId,
      startsOn: body.startsOn,
      endsOn: body.endsOn,
    },
  );
export const endTeachingAssignment = (org: string, id: string, endsOn: string, reason: string) =>
  api.patch<AcademicTeachingAssignment>(
    `/school-education/${encodeURIComponent(org)}/teaching-assignments/${encodeURIComponent(id)}/end`,
    { endsOn, reason },
  );
export const listSubjectBookReferences = (org: string, page: AcademicQuery = {}) =>
  api.get<AcademicPage<AcademicSubjectBookReference>>(
    `/school-education/${encodeURIComponent(org)}/subject-books?${academicQuery(page)}`,
  );
export const createSubjectBookReference = (org: string, subjectId: string, bookId: string) =>
  api.post<AcademicSubjectBookReference>(
    `/school-education/${encodeURIComponent(org)}/subject-books`,
    { subjectId, bookId },
  );
