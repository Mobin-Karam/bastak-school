import { RetryRequestStatus } from "../../../database/entities/exam-retry-request.entity";
import { SyllabusProgressStatus } from "../../../database/entities/syllabus-progress.entity";
export declare class SyllabusDto {
    subject: string;
    description?: string;
    required?: boolean;
    track?: string;
}
export declare class SyllabusProgressDto {
    status: SyllabusProgressStatus;
    accuracy?: number;
    note?: string;
}
export declare class RetryRequestDto {
    message?: string;
}
export declare class ModerateRetryDto {
    status: RetryRequestStatus;
    note?: string;
}
export declare class QuizQuestionDto {
    text: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    sortOrder?: number;
}
export declare class CreateQuizDto {
    title: string;
    subject?: string;
    durationMinutes?: number;
    examId?: string;
    organizationId?: string;
    active?: boolean;
    attemptLimit?: number;
    openAt?: string | null;
    closeAt?: string | null;
    resultPolicy?: "immediate" | "manual";
}
export declare class UpdateQuizDto {
    title?: string;
    subject?: string;
    durationMinutes?: number;
    active?: boolean;
    attemptLimit?: number;
    openAt?: string | null;
    closeAt?: string | null;
    resultPolicy?: "immediate" | "manual";
}
export declare class QuizAssignmentsDto {
    studentIds: string[];
}
export declare class QuizClassAssignmentsDto {
    classIds: string[];
}
export declare class QuizAudienceRulesDto {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
}
export declare class QuizAnswerDto {
    questionId: string;
    selectedOption?: string | null;
}
export declare class SubmitQuizDto {
    runId: string;
    answers: QuizAnswerDto[];
}
