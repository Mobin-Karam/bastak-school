import { api } from "../../../shared/api/api";
import type { Exam } from "../../../shared/types/domain";
import type { AttemptDetail, AttemptSummary, ExamDraft } from "../model/exam-model";
import type { RetryRequest, SyllabusDraft } from "../model/exam.types";

export type ExamAssignmentView = {
  id: string;
  assignedAt: string;
  source: "direct";
  student: { id: string; name: string; grade?: string; major?: string };
  assignedBy?: { id: string; name: string } | null;
};

export function getExams() {
  return api.get<Exam[]>("/exams");
}

export function getRetryRequests() {
  return api.get<RetryRequest[]>("/exam-attempt-requests");
}

export function createExam(body: ExamDraft, studentId?: string) {
  return api.post("/exams", {
    ...body,
    ...(studentId ? { studentId } : {}),
  });
}

export function updateExam(examId: string, body: Partial<ExamDraft>) {
  return api.patch(`/exams/${examId}`, body);
}

export function deleteExam(examId: string) {
  return api.delete(`/exams/${examId}`);
}

export function getExamAssignments(examId: string) {
  return api.get<ExamAssignmentView[]>(`/exams/${examId}/assignments`);
}

export function assignExam(examId: string, studentIds: string[]) {
  return api.post(`/exams/${examId}/assignments`, { studentIds });
}

export function unassignExam(examId: string, studentId: string) {
  return api.delete(`/exams/${examId}/assignments/${studentId}`);
}

export type ExamClassAssignment = {
  id: string;
  classId: string;
  name: string;
  code: string;
  schoolYear: string;
  enrollmentCount: number;
};
export function getExamClassAssignments(examId: string) {
  return api.get<ExamClassAssignment[]>(`/exams/${examId}/class-assignments`);
}
export function setExamClassAssignments(examId: string, classIds: string[]) {
  return api.put<ExamClassAssignment[]>(`/exams/${examId}/class-assignments`, { classIds });
}
export type ExamAudienceRules = {
  gradeIds: number[];
  educationTypeIds: string[];
  trackIds: string[];
  learnerProfiles: string[];
  independentTypes: string[];
};
export function setExamAudienceRules(examId: string, body: ExamAudienceRules) {
  return api.put<ExamAudienceRules>(`/exams/${examId}/audience-rules`, body);
}

export function reviewRetryRequest(
  requestId: string,
  status: "approved" | "rejected",
  advisorNote: string,
) {
  return api.patch(`/exam-attempt-requests/${requestId}`, {
    status,
    note: advisorNote,
  });
}

export function addExamSyllabus(examId: string, data: SyllabusDraft) {
  return api.post(`/exams/${examId}/syllabus`, data);
}

export function deleteExamSyllabus(syllabusId: string) {
  return api.delete(`/syllabus/${syllabusId}`);
}

export function setExamPublished(examId: string, published: boolean) {
  return api.patch(`/exams/${examId}`, {
    published,
  });
}

export function getExamAttemptHistory(studentId: string) {
  return api.get<AttemptSummary[]>(`/students/${studentId}/exam-attempts`);
}

export function getExamAttemptDetail(studentId: string, attemptId: string) {
  return api.get<AttemptDetail>(`/students/${studentId}/exam-attempts/${attemptId}`);
}
export type ExamAnalytics = {
  attempts: number;
  averagePercent: number | null;
  byGrade: Array<{ grade: string; attempts: number; averagePercent: number }>;
  questions: Array<{
    id: string;
    text: string;
    accuracy: number | null;
    responses: Record<string, number>;
  }>;
};
export function getExamAnalytics(examId: string) {
  return api.get<ExamAnalytics>(`/exams/${examId}/analytics`);
}
