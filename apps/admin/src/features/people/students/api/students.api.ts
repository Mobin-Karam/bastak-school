import { api } from "../../../../shared/api/api";
import type { Student } from "../../../../shared/types/domain";
import type { LearningResponse } from "../../../academics/learning/learning-model";
import type { StudentForm } from "../model/student-form";
import { normalizeIranianPhoneNumber, studentPayload } from "../model/student-form";
export const createStudent = (body: StudentForm, organizationId?: string) => {
  const payload = studentPayload(body, true);
  return api.post<Student>("/students", {
    name: payload.name,
    phoneNumber: normalizeIranianPhoneNumber(payload.username),
    password: payload.password,
    learnerProfile: payload.learnerProfile,
    independentType: payload.independentType,
    learningLevel: payload.learningLevel,
    gradeId: payload.gradeId,
    educationTypeId: payload.educationTypeId,
    trackId: payload.trackId,
    grade: payload.grade,
    major: payload.major,
    nationalCode: payload.nationalCode,
    birthDateJalali: payload.birthDateJalali,
    governmentSchool: payload.governmentSchool,
    classId: payload.classId,
    mother: payload.mother,
    father: payload.father,
    ...(organizationId ? { organizationId } : {}),
  });
};
export const updateStudent = (id: string, body: StudentForm) => {
  const { username, ...payload } = studentPayload(body, false);
  return api.patch<Student>(`/students/${id}`, {
    ...payload,
    ...(username ? { phoneNumber: normalizeIranianPhoneNumber(username) } : {}),
  });
};
export const archiveStudent = (id: string) => api.delete(`/students/${id}`);
export const listStudents = () => api.get<Student[]>("/students");
export const studentLifecycle = (
  id: string,
  action: "activate" | "deactivate" | "restore" | "force-logout",
) => api.post(`/students/${id}/${action}`, {});
export const resetStudentPassword = (id: string, password: string) =>
  api.post(`/students/${id}/reset-password`, { password });
export const getStudentOverview = (id: string) => api.get<Student>(`/students/${id}/overview`);
/** Detailed, server-authorized profile projection; do not synthesize this from list data. */
export const getStudentProfile = (id: string) =>
  api.get<StudentProfile>(`/students/${encodeURIComponent(id)}/profile`);
export const getStudentLearning = (id: string) =>
  api.get<LearningResponse>(`/students/${id}/learning`);
export const getStudentAttempts = (id: string) =>
  api.get<unknown[]>(`/students/${id}/exam-attempts`);
export const getStudentWeekly = (id: string) =>
  api.get<Record<string, unknown>>(`/students/${id}/progress/weekly`);
export const getStudentTopics = (id: string) =>
  api.get<unknown[]>(`/students/${id}/performance/topics?limit=8`);
export type StudentAnalytics = {
  planCompletion: number | null;
  taskCompletion: number | null;
  studyDurationMinutes: number | null;
  studySessions: number;
  examPerformance: number | null;
  examAttempts: number;
  questionAccuracy: number | null;
  quizAttempts: number;
  reviewConsistency: number;
  averageMastery: number | null;
  subjectPerformance: Array<{ subject: string; items: number; mastery: number | null }>;
};
export type StudentProfile = Student & {
  identity: {
    firstName: string;
    lastName: string;
    fullName: string;
    nationalCode: string | null;
    phoneNumber: string | null;
    email: string | null;
    profilePhoto: string;
  };
  contact: { phoneNumber: string | null; email: string | null };
  education: {
    learnerProfile: string;
    independentType: string | null;
    learningLevel: string;
    gradeId: number | null;
    educationTypeId: string;
    trackId: string;
    grade: string;
    major: string;
    targetUniversity: string;
    targetField: string;
    targetRank: string;
    dailyCapacity: string;
  };
  attendanceSummary: {
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  recentAttendance: Array<{
    id: string;
    sessionId: string;
    status: string;
    sessionDate: string;
    contextType: string;
    contextId: string;
    organizationId: string;
    recordedAt: string;
  }>;
};
export type StudentRecommendation = {
  id: string;
  type: string;
  title: string;
  reason: string;
  evidence: Record<string, unknown>;
  status: "PROPOSED" | "ACCEPTED" | "REJECTED" | "DISMISSED";
  createdAt: string;
};
export type StudentMistake = { id: string; questionId: string; reason: string; resolved: boolean };
export const getStudentAnalytics = (id: string) =>
  api.get<StudentAnalytics>(`/students/${id}/analytics`);
export const getStudentRecommendations = (id: string) =>
  api.get<StudentRecommendation[]>(`/students/${id}/recommendations`);
export const createStudentRecommendation = (
  id: string,
  body: { type: string; title: string; reason: string; evidence: Record<string, unknown> },
) => api.post<StudentRecommendation>(`/students/${id}/recommendations`, body);
export const getStudentMistakes = (id: string) =>
  api.get<StudentMistake[]>(`/students/${id}/mistakes`);
