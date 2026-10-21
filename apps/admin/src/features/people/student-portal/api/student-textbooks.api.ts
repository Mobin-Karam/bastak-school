import { api } from "../../../../shared/api/api";

export type StudentTextbook = {
  id: string;
  schoolYear: string;
  grade: number;
  titleFa: string;
  titleEn: string;
  branch: string;
  track: string;
  category: string;
  textbookCode?: string | null;
  appliesTo: string[];
};

export type StudentTextbooks = {
  schoolYear: string;
  education: {
    gradeId: number;
    gradeLabel: string;
    educationTypeId: string;
    trackId: string;
    trackLabel: string;
  };
  books: StudentTextbook[];
};

/** The API derives the education profile from the authenticated student account. */
export const getStudentTextbooks = () => api.get<StudentTextbooks>("/education-catalog/my-books");
