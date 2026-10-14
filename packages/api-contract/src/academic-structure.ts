export type AcademicTeachingAssignment = {
  id: string;
  organizationId: string;
  academicYearId: string;
  termId: string | null;
  classroomId: string;
  subjectId: string;
  teacherId: string;
  startsOn: string;
  endsOn: string;
  status: "ACTIVE" | "ENDED";
  createdById: string;
  createdAt: string;
};
export type AcademicSubjectBookReference = {
  id: string;
  organizationId: string;
  subjectId: string;
  bookId: string;
  createdAt: string;
};
export type AcademicEnrollmentHistory = {
  id: string;
  organizationId: string;
  classroomId: string;
  actorId: string;
  beforeStudentIds: string[];
  afterStudentIds: string[];
  createdAt: string;
};
export type AcademicPage<T> = {
  items: T[];
  total: number;
  offset: number;
  limit: number;
};
