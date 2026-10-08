export declare class CreateQuestionDto {
    text?: string;
    question?: string;
    options: string[];
    correctAnswer?: string;
    correctOption?: string;
    explanation?: string;
    subject?: string;
    topic?: string;
    sectionId?: string;
    mediaUrl?: string;
    difficulty?: string;
    source?: string;
    tags?: string[];
}
export declare class CreateExamDto {
    title: string;
    subject?: string;
    duration?: number;
    durationMinutes?: number;
    attemptLimit?: number;
    startTime?: string;
    endTime?: string;
    openAt?: string;
    closeAt?: string;
    isoDate?: string;
    studentId?: string;
    organizationId?: string;
    published?: boolean;
    mode?: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
    description?: string;
    lifecycleStatus?: "draft" | "scheduled" | "cancelled";
    navigationMode?: "free" | "section_only" | "sequential";
    timerMode?: "whole_exam" | "per_section";
    allowResume?: boolean;
    allowLateStart?: boolean;
    allowPracticeAfterDeadline?: boolean;
    autoSubmitOnTimeout?: boolean;
    sessionPolicy?: "single_session" | "allow_resume";
    integrityMonitoring?: boolean;
    latestStartAt?: string;
    answerKeyReleaseAt?: string;
    explanationReleaseAt?: string;
    rankingReleaseAt?: string;
    instructions?: string[];
    allowBackNavigation?: boolean;
    scoring?: {
        correct: number;
        wrong: number;
        unanswered: number;
        negativeMarking: boolean;
    };
    resultPolicy?: "immediate" | "scheduled" | "manual";
    resultReleaseAt?: string;
    resultsReleased?: boolean;
    sections?: Array<{
        id: string;
        name: string;
        questionIds: string[];
        allocatedMinutes?: number;
    }>;
    questions?: CreateQuestionDto[];
}
declare const UpdateExamDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateExamDto>>;
export declare class UpdateExamDto extends UpdateExamDto_base {
}
export declare class AssignExamDto {
    studentIds: string[];
}
export declare class ExamClassAssignmentsDto {
    classIds: string[];
}
export declare class ExamAudienceRulesDto {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
}
export {};
