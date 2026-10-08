import { Organization } from "./organization.entity";
export declare class QuestionBankItem {
    id: string;
    organization?: Organization | null;
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
    archivedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
