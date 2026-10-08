import { AuthenticatedUser } from "../auth";
import { AssessmentsService } from "./assessments.service";
import { CreateQuizDto, ModerateRetryDto, QuizAssignmentsDto, QuizAudienceRulesDto, QuizClassAssignmentsDto, QuizQuestionDto, RetryRequestDto, SubmitQuizDto, SyllabusDto, SyllabusProgressDto, UpdateQuizDto } from "./dto/assessment.dto";
export declare class AssessmentsController {
    private service;
    constructor(service: AssessmentsService);
    private context;
    addSyllabus(u: AuthenticatedUser, id: string, dto: SyllabusDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").ExamSyllabus;
    }>;
    removeSyllabus(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    progress(u: AuthenticatedUser, id: string, dto: SyllabusProgressDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").SyllabusProgress;
    }>;
    studentSyllabus(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            subject: string;
            description: string;
            required: boolean;
            track: string;
            progress: {
                status: import("../../database/entities/syllabus-progress.entity").SyllabusProgressStatus;
                accuracy: number;
                note: string;
                updatedAt: Date;
            } | null;
        }[];
    }>;
    retry(u: AuthenticatedUser, id: string, dto: RetryRequestDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").ExamRetryRequest;
    }>;
    studentRetries(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            examId: string;
            examTitle: string;
            message: string;
            status: import("../../database/entities/exam-retry-request.entity").RetryRequestStatus;
            moderatorNote: string;
            resolvedAt: Date | null | undefined;
            createdAt: Date;
        }[];
    }>;
    retries(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("../../database/entities").ExamRetryRequest[];
    }>;
    moderate(u: AuthenticatedUser, id: string, dto: ModerateRetryDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").ExamRetryRequest;
    }>;
    studentQuizzes(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            title: string;
            subject: string;
            durationMinutes: number;
            questionCount: number;
            examId: string | null;
            attemptLimit: number;
            attemptsUsed: number;
            openAt: Date | null | undefined;
            closeAt: Date | null | undefined;
            resultPolicy: "immediate" | "manual";
            attempt: {
                id: string;
                submittedAt: Date | null | undefined;
                percent: number;
            } | null;
        }[];
    }>;
    quizzes(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: import("../../database/entities").Quiz[];
    }>;
    createQuiz(u: AuthenticatedUser, dto: CreateQuizDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Quiz;
    }>;
    updateQuiz(u: AuthenticatedUser, id: string, dto: UpdateQuizDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Quiz;
    }>;
    quizAssignments(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            studentId: string;
            name: string;
            grade: string;
            gradeId: number | null | undefined;
            educationTypeId: string;
            trackId: string;
        }[];
    }>;
    assignQuiz(u: AuthenticatedUser, id: string, dto: QuizAssignmentsDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            studentId: string;
            name: string;
            grade: string;
            gradeId: number | null | undefined;
            educationTypeId: string;
            trackId: string;
        }[];
    }>;
    quizClassAssignments(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            classId: string;
            name: string;
            code: string;
            schoolYear: string;
            enrollmentCount: number;
        }[];
    }>;
    assignQuizClasses(u: AuthenticatedUser, id: string, dto: QuizClassAssignmentsDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            classId: string;
            name: string;
            code: string;
            schoolYear: string;
            enrollmentCount: number;
        }[];
    }>;
    setQuizAudienceRules(u: AuthenticatedUser, id: string, dto: QuizAudienceRulesDto): Promise<{
        ok: boolean;
        data: {
            gradeIds: number[];
            educationTypeIds: string[];
            trackIds: string[];
            learnerProfiles: string[];
            independentTypes: string[];
        };
    }>;
    releaseQuizResults(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            resultsReleasedAt: Date;
        };
    }>;
    removeQuiz(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            archived: boolean;
            reason: string;
            deleted?: undefined;
        } | {
            id: string;
            deleted: boolean;
            archived?: undefined;
            reason?: undefined;
        };
    }>;
    history(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: Record<string, unknown> | (import("../../database/entities").QuizAttempt | {
            id: string;
            quizId: string;
            startedAt: Date;
            submittedAt: Date | null | undefined;
            resultPending: boolean;
        })[];
    }>;
    historyDetail(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: Record<string, unknown> | (import("../../database/entities").QuizAttempt | {
            id: string;
            quizId: string;
            startedAt: Date;
            submittedAt: Date | null | undefined;
            resultPending: boolean;
        })[];
    }>;
    questions(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            quiz: import("../../database/entities").Quiz;
            text: string;
            options: string[];
            sortOrder: number;
            questionBankItemId?: string | null;
        }[];
    }>;
    analytics(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            quiz: {
                id: string;
                title: string;
            };
            attempts: number;
            averagePercent: number | null;
            questions: {
                id: string;
                text: string;
                sortOrder: number;
                attempts: number;
                correct: number;
                accuracy: number | null;
                responses: {
                    [key: string]: number;
                };
            }[];
            byGrade: {
                grade: string;
                attempts: number;
                averagePercent: number;
            }[];
        };
    }>;
    addQuestion(u: AuthenticatedUser, id: string, dto: QuizQuestionDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").QuizQuestion;
    }>;
    updateQuestion(u: AuthenticatedUser, id: string, dto: QuizQuestionDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").QuizQuestion;
    }>;
    removeQuestion(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    quiz(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            questions: {
                id: string;
                quiz: import("../../database/entities").Quiz;
                text: string;
                options: string[];
                sortOrder: number;
                questionBankItemId?: string | null;
            }[];
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
            exam?: import("../../database/entities").Exam | null;
            organization?: import("../../database/entities").Organization | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    start(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            runId: string;
            startedAt: Date;
            deadline: Date;
            remainingSeconds: number;
            savedAnswers: {
                questionId: string;
                selectedOption?: string | null;
            }[];
            quiz: {
                id: string;
                title: string;
                durationMinutes: number;
                questions: {
                    id: string;
                    quiz: import("../../database/entities").Quiz;
                    text: string;
                    options: string[];
                    sortOrder: number;
                    questionBankItemId?: string | null;
                }[];
            };
        };
    }>;
    submit(u: AuthenticatedUser, id: string, dto: SubmitQuizDto): Promise<{
        ok: boolean;
        data: Record<string, unknown>;
    }>;
}
