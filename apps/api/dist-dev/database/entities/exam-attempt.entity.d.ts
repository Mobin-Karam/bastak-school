import { Exam } from "./exam.entity";
import { Student } from "./student.entity";
export declare class ExamAttempt {
    id: string;
    exam: Exam;
    student: Student;
    score: number;
    status: "active" | "submitted" | "expired" | "cancelled";
    expiresAt?: Date | null;
    submittedAt?: Date | null;
    lastHeartbeatAt?: Date | null;
    currentSectionId: string;
    rawScore?: number | null;
    percentage?: number | null;
    correctCount?: number | null;
    incorrectCount?: number | null;
    unansweredCount?: number | null;
    answers: Array<{
        questionId: string;
        selectedOption?: string | null;
        marked?: boolean;
        visited?: boolean;
        clientUpdatedAt?: string;
        revision?: number;
        approximateTimeSpentSeconds?: number;
    }>;
    startedAt: Date;
    finishedAt?: Date | null;
}
