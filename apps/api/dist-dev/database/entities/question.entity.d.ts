import { Exam } from "./exam.entity";
export declare class Question {
    id: string;
    exam: Exam;
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
    subtopic: string;
    questionType: string;
    weight: number;
    sectionId: string;
    mediaUrl: string;
    difficulty: string;
    source: string;
    questionBankItemId?: string | null;
    sortOrder: number;
    tags: string[];
}
