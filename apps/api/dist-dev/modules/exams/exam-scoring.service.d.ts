import { Exam } from "../../database/entities/exam.entity";
type SelectedAnswer = {
    questionId: string;
    selectedOption?: string | null;
};
export declare class ExamScoringService {
    evaluate(exam: Exam, answers: SelectedAnswer[]): {
        percentage: number;
        subjects: {
            percentage: number;
            correct: number;
            wrong: number;
            unanswered: number;
            total: number;
            rawScore: number;
            maximum: number;
            subject: string;
        }[];
        topics: {
            percentage: number;
            correct: number;
            wrong: number;
            unanswered: number;
            total: number;
            rawScore: number;
            maximum: number;
            subject: string;
            topic: string;
        }[];
        correct: number;
        wrong: number;
        unanswered: number;
        total: number;
        rawScore: number;
        maximum: number;
    };
    private row;
    private add;
}
export {};
