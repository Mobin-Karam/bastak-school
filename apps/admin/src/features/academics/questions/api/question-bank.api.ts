import { api } from "../../../shared/api/api";

export type QuestionBankItem = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject: string;
  topic: string;
  book: string;
  grade: string;
  chapter: string;
  lesson: string;
  difficulty: string;
  source: string;
  tags: string[];
  bankType: "exam" | "quiz";
  sourceQuestionBankItemId?: string | null;
  organization?: { id: string; name: string } | null;
  updatedAt: string;
};
export type QuestionBankDraft = Omit<
  QuestionBankItem,
  "id" | "organization" | "updatedAt" | "bankType" | "sourceQuestionBankItemId"
> & {
  organizationId: string;
  bankType?: "exam" | "quiz";
};
export const listQuestionBank = (organizationId?: string, bankType: "exam" | "quiz" = "exam") =>
  api.get<QuestionBankItem[]>(
    `/question-bank?${new URLSearchParams({ ...(organizationId ? { organizationId } : {}), bankType }).toString()}`,
  );
export type QuestionBankTransfer = {
  schemaVersion: "1.0";
  bankType: "exam" | "quiz";
  questions: QuestionBankDraft[];
};
export const getQuestionBankTemplate = (bankType: "exam" | "quiz") =>
  api.get<QuestionBankTransfer>(`/question-bank/template?bankType=${bankType}`);
export const exportQuestionBank = (bankType: "exam" | "quiz", organizationId?: string) =>
  api.get<QuestionBankTransfer>(
    `/question-bank/export?${new URLSearchParams({ bankType, ...(organizationId ? { organizationId } : {}) })}`,
  );
export const importQuestionBank = (body: QuestionBankTransfer) =>
  api.post<{ created: number }>("/question-bank/import", body);
export const createQuestionBankItem = (body: QuestionBankDraft) =>
  api.post<QuestionBankItem>("/question-bank", body);
export const updateQuestionBankItem = (id: string, body: Partial<QuestionBankDraft>) =>
  api.patch<QuestionBankItem>(`/question-bank/${encodeURIComponent(id)}`, body);
export const archiveQuestionBankItem = (id: string) =>
  api.delete<{ archived: boolean }>(`/question-bank/${encodeURIComponent(id)}`);
export const addBankItemToExam = (id: string, examId: string) =>
  api.post(`/question-bank/${encodeURIComponent(id)}/add-to-exam`, { examId });
export const addBankItemToQuiz = (id: string, quizId: string) =>
  api.post(`/question-bank/${encodeURIComponent(id)}/add-to-quiz`, { quizId });
export const copyExamItemsToQuizBank = (itemIds: string[]) =>
  api.post<{ created: number; skipped: number }>("/question-bank/copy-exam-items-to-quiz-bank", {
    itemIds,
  });
export type QuestionBankGeneration = {
  examId: string;
  subject?: string;
  topic?: string;
  grade?: string;
  chapter?: string;
  easy?: number;
  medium?: number;
  hard?: number;
  itemIds?: string[];
  commit?: boolean;
};
export const generateExamFromBank = (body: QuestionBankGeneration) =>
  api.post<{
    preview: boolean;
    created?: number;
    skipped?: number;
    selected?: Array<{ id: string; text: string; difficulty: string }>;
  }>("/question-bank/generate/exam", body);
