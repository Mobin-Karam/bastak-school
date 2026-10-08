import { Exam } from "./exam.entity";
import { Organization } from "./organization.entity";
import { QuizQuestion } from "./quiz-question.entity";
export declare class Quiz {
    id: string;
    title: string;
    subject: string;
    durationMinutes: number;
    active: boolean;
    attemptLimit: number;
    openAt?: Date | null;
    closeAt?: Date | null;
    resultPolicy: "immediate" | "manual";
    resultsReleasedAt?: Date | null;
    audienceRules: {
        gradeIds: number[];
        educationTypeIds: string[];
        trackIds: string[];
        learnerProfiles: string[];
        independentTypes: string[];
    };
    exam?: Exam | null;
    organization?: Organization | null;
    questions: QuizQuestion[];
    createdAt: Date;
    updatedAt: Date;
}
