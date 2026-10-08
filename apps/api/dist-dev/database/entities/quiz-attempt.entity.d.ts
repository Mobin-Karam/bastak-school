import { Quiz } from "./quiz.entity";
import { Student } from "./student.entity";
export declare class QuizAttempt {
    id: string;
    quiz: Quiz;
    student: Student;
    startedAt: Date;
    submittedAt?: Date | null;
    answers: Array<{
        questionId: string;
        selectedOption?: string | null;
    }>;
    correct: number;
    wrong: number;
    blank: number;
    percent: number;
}
