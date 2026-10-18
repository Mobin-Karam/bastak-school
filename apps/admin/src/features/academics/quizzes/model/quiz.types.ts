import type { QuestionView } from "../../questions/question-model";
export type Quiz = {
  id: string;
  title: string;
  subject?: string;
  durationMinutes: number;
  active: boolean;
  attemptLimit: number;
  openAt?: string | null;
  closeAt?: string | null;
  resultPolicy?: "immediate" | "manual";
  audienceRules?: {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
  };
  exam?: { id: string; title: string } | null;
  questions: Array<{ id: string }>;
};
export type QuizDraft = {
  title: string;
  subject: string;
  durationMinutes: number;
  attemptLimit: number;
  openAt?: string | null;
  closeAt?: string | null;
  resultPolicy?: "immediate" | "manual";
};
export type QuizQuestion = QuestionView & { id: string };
