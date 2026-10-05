import { api } from "../../../shared/api/api";

export type EducationOperationsOverview = {
  scope: "platform" | "organization";
  period: { from: string; to: string } | null;
  cohort: { grade: number } | null;
  students: { total: number; complete: number; incomplete: number; missingMappings: number };
  coverage: {
    planned: number;
    withoutPlan: number;
    resourced: number;
    withoutResources: number;
    examined: number;
    reported: number;
  };
  trends: {
    submittedAttempts: number;
    averageExamPercentage: number | null;
    totalStudyHours: number;
    averageStudyHours: number | null;
  };
  remediation: Record<
    "incompleteProfiles" | "withoutPlan" | "withoutResources" | "withoutExam" | "withoutReport",
    Array<{ id: string; name: string; grade: number | null; reason: string }>
  >;
  catalog: { published: number; draft: number; archived: number };
  distribution: Array<{ label: string; count: number }>;
};

export type ManagedEducationBook = {
  id: string;
  schoolYear: string;
  grade: number;
  titleFa: string;
  titleEn: string;
  country: string;
  level: string;
  branch: string;
  track: string;
  category: string;
  textbookCode?: string | null;
  appliesTo: string[];
  notes?: string | null;
  state: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  organizationId?: string | null;
};

export type EducationBookInput = Pick<
  ManagedEducationBook,
  | "id"
  | "schoolYear"
  | "grade"
  | "titleFa"
  | "country"
  | "level"
  | "branch"
  | "track"
  | "category"
  | "appliesTo"
> &
  Partial<
    Pick<ManagedEducationBook, "titleEn" | "textbookCode" | "notes" | "state" | "organizationId">
  >;

export const getEducationOperations = (filters?: {
  period?: { from: string; to: string } | null;
  grade?: number | null;
}) => {
  const params = new URLSearchParams();
  if (filters?.period) {
    params.set("from", filters.period.from);
    params.set("to", filters.period.to);
  }
  if (filters?.grade) params.set("grade", String(filters.grade));
  return api.get<EducationOperationsOverview>(
    `/education-catalog/admin/overview${params.size ? `?${params.toString()}` : ""}`,
  );
};
export const getManagedBooks = () =>
  api.get<ManagedEducationBook[]>("/education-catalog/admin/books");
export const getEducationBookImpact = (id: string) =>
  api.get<{
    bookId: string;
    affectedStudents: number;
    sample: Array<{ id: string; name: string; grade: number }>;
  }>(`/education-catalog/admin/books/${encodeURIComponent(id)}/impact`);
export const createEducationBook = (body: EducationBookInput) =>
  api.post<ManagedEducationBook>("/education-catalog/admin/books", body);
export const updateEducationBook = (id: string, body: Partial<EducationBookInput>) =>
  api.patch<ManagedEducationBook>(`/education-catalog/admin/books/${id}`, body);
export const publishEducationBook = (id: string) =>
  api.post<ManagedEducationBook>(`/education-catalog/admin/books/${id}/publish`, {});
export type EducationImportPreview = {
  valid: boolean;
  accepted: number;
  rejected: number;
  rows: Array<{ row: number; id: string | null; valid: boolean; errors: string[] }>;
};
export const previewEducationImport = (books: EducationBookInput[]) =>
  api.post<EducationImportPreview>("/education-catalog/admin/books/import-preview", { books });
export const commitEducationImport = (books: EducationBookInput[]) =>
  api.post<{ imported: number }>("/education-catalog/admin/books/import-commit", { books });
