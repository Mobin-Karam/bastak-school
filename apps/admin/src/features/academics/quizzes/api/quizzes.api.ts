import { api } from "../../../shared/api/api";
import type { QuestionDraft } from "../../questions/question-model";
import type { Quiz, QuizDraft, QuizQuestion } from "../model/quiz.types";
export const getQuizzes = () => api.get<Quiz[]>("/quizzes");
type QuizQuestionResponse = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  sortOrder?: number;
};
export const getQuizQuestions = async (quizId: string): Promise<QuizQuestion[]> =>
  (await api.get<QuizQuestionResponse[]>(`/quizzes/${quizId}/questions`)).map(fromResponse);
export const createQuiz = (body: QuizDraft) => api.post<{ id: string }>("/quizzes", body);
export const updateQuiz = (id: string, body: QuizDraft | Partial<Quiz>) =>
  api.patch(`/quizzes/${id}`, body);
export const deleteQuiz = (id: string) =>
  api.delete<{ deleted?: boolean; archived?: boolean }>(`/quizzes/${id}`);
export type QuizAssignment = {
  id: string;
  studentId: string;
  name: string;
  grade?: string | null;
  gradeId?: number | null;
  educationTypeId?: string | null;
  trackId?: string | null;
};
export const getQuizAssignments = (id: string) =>
  api.get<QuizAssignment[]>(`/quizzes/${id}/assignments`);
export const setQuizAssignments = (id: string, studentIds: string[]) =>
  api.put<QuizAssignment[]>(`/quizzes/${id}/assignments`, { studentIds });
export type QuizClassAssignment = {
  id: string;
  classId: string;
  name: string;
  code: string;
  schoolYear: string;
  enrollmentCount: number;
};
export const getQuizClassAssignments = (id: string) =>
  api.get<QuizClassAssignment[]>(`/quizzes/${id}/class-assignments`);
export const setQuizClassAssignments = (id: string, classIds: string[]) =>
  api.put<QuizClassAssignment[]>(`/quizzes/${id}/class-assignments`, { classIds });
export type QuizAudienceRules = {
  gradeIds: number[];
  educationTypeIds: string[];
  trackIds: string[];
  learnerProfiles: string[];
  independentTypes: string[];
};
export const setQuizAudienceRules = (id: string, body: QuizAudienceRules) =>
  api.put<QuizAudienceRules>(`/quizzes/${id}/audience-rules`, body);
export const releaseQuizResults = (id: string) =>
  api.post<{ id: string; resultsReleasedAt: string }>(`/quizzes/${id}/release-results`, {});
export type QuizAnalytics = {
  attempts: number;
  averagePercent: number | null;
  byGrade: Array<{ grade: string; attempts: number; averagePercent: number }>;
  questions: Array<{
    id: string;
    text: string;
    sortOrder: number;
    attempts: number;
    correct: number;
    accuracy: number | null;
    responses: Record<string, number>;
  }>;
};
export const getQuizAnalytics = (id: string) => api.get<QuizAnalytics>(`/quizzes/${id}/analytics`);
export const createQuizQuestion = (quizId: string, body: QuestionDraft) =>
  api.post(`/quizzes/${quizId}/questions`, toRequest(body));
export const updateQuizQuestion = (id: string, body: QuestionDraft) =>
  api.patch(`/quiz-questions/${id}`, toRequest(body));
export const deleteQuizQuestion = (id: string) => api.delete(`/quiz-questions/${id}`);

function toRequest(question: QuestionDraft) {
  const correctIndex = ["a", "b", "c", "d"].indexOf(question.correctOption);
  return {
    text: question.question,
    options: question.options,
    correctAnswer: question.options[correctIndex] || "",
    explanation: question.explanation,
    sortOrder: question.sortOrder,
  };
}

function fromResponse(question: QuizQuestionResponse): QuizQuestion {
  const correctIndex = question.options.indexOf(question.correctAnswer);
  return {
    id: question.id,
    question: question.text,
    options: question.options,
    correctOption: ["a", "b", "c", "d"][correctIndex] || "a",
    explanation: question.explanation || "",
    sortOrder: question.sortOrder || 1,
  };
}
