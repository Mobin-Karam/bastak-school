import { Quiz } from "./quiz.entity";
export declare class QuizQuestion {
    id: string;
    quiz: Quiz;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    sortOrder: number;
    questionBankItemId?: string | null;
}
