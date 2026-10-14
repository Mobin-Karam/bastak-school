import { AuthenticatedUser } from "../auth";
import { AssignExamDto, ExamAudienceRulesDto, ExamClassAssignmentsDto, CreateExamDto, CreateQuestionDto, UpdateExamDto } from "./dto/create-exam.dto";
import { ExamsService } from "./exams.service";
import { ExamHeartbeatDto, SubmitExamDto } from "./dto/submit-exam.dto";
import { AuthorizationService } from "../authorization";
export declare class ExamsController {
    private readonly exams;
    private readonly authorization;
    constructor(exams: ExamsService, authorization: AuthorizationService);
    private context;
    listCanonical(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            serverTime: string;
            id: string;
            title: string;
            description: string;
            subject: string;
            subjects: string[];
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: string;
            updatedAt: string;
            mode: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
            status: string;
            instructions: string[];
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            allowResume: boolean;
            allowLateStart: boolean;
            allowPracticeAfterDeadline: boolean;
            autoSubmitOnTimeout: boolean;
            sessionPolicy: "single_session" | "allow_resume";
            integrityMonitoring: boolean;
            scoring: {
                correct: number;
                wrong: number;
                unanswered: number;
                negativeMarking: boolean;
            };
            resultPolicy: "scheduled" | "immediate" | "manual";
            resultReleaseAt: string | null;
            answerKeyReleaseAt: string | null;
            explanationReleaseAt: string | null;
            rankingReleaseAt: string | null;
            resultsReleased: boolean;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            syllabus: {
                id: string;
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            duration: number;
            durationMinutes: number;
            attemptLimit: number;
            maxAttempts: number;
            startTime: Date | null | undefined;
            endTime: Date | null | undefined;
            availableFrom: string | undefined;
            availableUntil: string | undefined;
            latestStartAt: string | null;
            openAt: string | undefined;
            closeAt: string | undefined;
            isoDate: string;
            published: boolean;
            audienceRules: {
                gradeIds: number[];
                educationTypeIds: string[];
                trackIds: string[];
                learnerProfiles: string[];
                independentTypes: string[];
            };
            questions: {
                id: string;
                text: string;
                question: string;
                options: string[];
                correctAnswer: string;
                correctOption: string;
                explanation: string;
                subject: string;
                topic: string;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[] | undefined;
            delivery: {
                questionCount: number;
                assignmentCount: number;
                attemptCount: number;
                activeAttemptCount: number;
                completedAttemptCount: number;
                notStartedCount: number;
                allowedAttempts: number;
                attemptsUsed: number;
                activeAttemptId: string | null;
                canStart: boolean;
                reason: string | undefined;
                state: string;
                lastAttempt: {
                    id: string;
                    examId: string;
                    title: string;
                    status: string;
                    score: number | null;
                    subjectSummary: {
                        percentage: number;
                        correct: number;
                        wrong: number;
                        unanswered: number;
                        total: number;
                        subject: string;
                    }[] | undefined;
                    startedAt: Date;
                    finishedAt: Date | null;
                    answeredCount: number;
                } | null;
            };
        }[];
    }>;
    createCanonical(user: AuthenticatedUser, dto: CreateExamDto): Promise<{
        ok: boolean;
        data: {
            serverTime: string;
            id: string;
            title: string;
            description: string;
            subject: string;
            subjects: string[];
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: string;
            updatedAt: string;
            mode: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
            status: string;
            instructions: string[];
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            allowResume: boolean;
            allowLateStart: boolean;
            allowPracticeAfterDeadline: boolean;
            autoSubmitOnTimeout: boolean;
            sessionPolicy: "single_session" | "allow_resume";
            integrityMonitoring: boolean;
            scoring: {
                correct: number;
                wrong: number;
                unanswered: number;
                negativeMarking: boolean;
            };
            resultPolicy: "scheduled" | "immediate" | "manual";
            resultReleaseAt: string | null;
            answerKeyReleaseAt: string | null;
            explanationReleaseAt: string | null;
            rankingReleaseAt: string | null;
            resultsReleased: boolean;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            syllabus: {
                id: string;
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            duration: number;
            durationMinutes: number;
            attemptLimit: number;
            maxAttempts: number;
            startTime: Date | null | undefined;
            endTime: Date | null | undefined;
            availableFrom: string | undefined;
            availableUntil: string | undefined;
            latestStartAt: string | null;
            openAt: string | undefined;
            closeAt: string | undefined;
            isoDate: string;
            published: boolean;
            audienceRules: {
                gradeIds: number[];
                educationTypeIds: string[];
                trackIds: string[];
                learnerProfiles: string[];
                independentTypes: string[];
            };
            questions: {
                id: string;
                text: string;
                question: string;
                options: string[];
                correctAnswer: string;
                correctOption: string;
                explanation: string;
                subject: string;
                topic: string;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[] | undefined;
            delivery: {
                questionCount: number;
                assignmentCount: number;
                attemptCount: number;
                activeAttemptCount: number;
                completedAttemptCount: number;
                notStartedCount: number;
                allowedAttempts: number;
                attemptsUsed: number;
                activeAttemptId: string | null;
                canStart: boolean;
                reason: string | undefined;
                state: string;
                lastAttempt: {
                    id: string;
                    examId: string;
                    title: string;
                    status: string;
                    score: number | null;
                    subjectSummary: {
                        percentage: number;
                        correct: number;
                        wrong: number;
                        unanswered: number;
                        total: number;
                        subject: string;
                    }[] | undefined;
                    startedAt: Date;
                    finishedAt: Date | null;
                    answeredCount: number;
                } | null;
            };
        };
    }>;
    updateCanonical(user: AuthenticatedUser, id: string, dto: UpdateExamDto): Promise<{
        ok: boolean;
        data: {
            serverTime: string;
            id: string;
            title: string;
            description: string;
            subject: string;
            subjects: string[];
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: string;
            updatedAt: string;
            mode: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
            status: string;
            instructions: string[];
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            allowResume: boolean;
            allowLateStart: boolean;
            allowPracticeAfterDeadline: boolean;
            autoSubmitOnTimeout: boolean;
            sessionPolicy: "single_session" | "allow_resume";
            integrityMonitoring: boolean;
            scoring: {
                correct: number;
                wrong: number;
                unanswered: number;
                negativeMarking: boolean;
            };
            resultPolicy: "scheduled" | "immediate" | "manual";
            resultReleaseAt: string | null;
            answerKeyReleaseAt: string | null;
            explanationReleaseAt: string | null;
            rankingReleaseAt: string | null;
            resultsReleased: boolean;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            syllabus: {
                id: string;
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            duration: number;
            durationMinutes: number;
            attemptLimit: number;
            maxAttempts: number;
            startTime: Date | null | undefined;
            endTime: Date | null | undefined;
            availableFrom: string | undefined;
            availableUntil: string | undefined;
            latestStartAt: string | null;
            openAt: string | undefined;
            closeAt: string | undefined;
            isoDate: string;
            published: boolean;
            audienceRules: {
                gradeIds: number[];
                educationTypeIds: string[];
                trackIds: string[];
                learnerProfiles: string[];
                independentTypes: string[];
            };
            questions: {
                id: string;
                text: string;
                question: string;
                options: string[];
                correctAnswer: string;
                correctOption: string;
                explanation: string;
                subject: string;
                topic: string;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[] | undefined;
            delivery: {
                questionCount: number;
                assignmentCount: number;
                attemptCount: number;
                activeAttemptCount: number;
                completedAttemptCount: number;
                notStartedCount: number;
                allowedAttempts: number;
                attemptsUsed: number;
                activeAttemptId: string | null;
                canStart: boolean;
                reason: string | undefined;
                state: string;
                lastAttempt: {
                    id: string;
                    examId: string;
                    title: string;
                    status: string;
                    score: number | null;
                    subjectSummary: {
                        percentage: number;
                        correct: number;
                        wrong: number;
                        unanswered: number;
                        total: number;
                        subject: string;
                    }[] | undefined;
                    startedAt: Date;
                    finishedAt: Date | null;
                    answeredCount: number;
                } | null;
            };
        };
    }>;
    removeCanonical(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    questionsCanonical(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            text: string;
            question: string;
            options: string[];
            correctAnswer: string;
            correctOption: string;
            explanation: string;
            subject: string;
            topic: string;
            sectionId: string;
            mediaUrl: string;
            difficulty: string;
            source: string;
            tags: string[];
        }[];
    }>;
    analytics(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            exam: {
                id: string;
                title: string;
            };
            attempts: number;
            averagePercent: number | null;
            byGrade: {
                grade: string;
                attempts: number;
                averagePercent: number;
            }[];
            questions: {
                id: string;
                text: string;
                attempts: number;
                correct: number;
                blank: number;
                accuracy: number | null;
                responses: Record<string, number>;
            }[];
        };
    }>;
    questionBankExams(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            serverTime: string;
            id: string;
            title: string;
            description: string;
            subject: string;
            subjects: string[];
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: string;
            updatedAt: string;
            mode: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
            status: string;
            instructions: string[];
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            allowResume: boolean;
            allowLateStart: boolean;
            allowPracticeAfterDeadline: boolean;
            autoSubmitOnTimeout: boolean;
            sessionPolicy: "single_session" | "allow_resume";
            integrityMonitoring: boolean;
            scoring: {
                correct: number;
                wrong: number;
                unanswered: number;
                negativeMarking: boolean;
            };
            resultPolicy: "scheduled" | "immediate" | "manual";
            resultReleaseAt: string | null;
            answerKeyReleaseAt: string | null;
            explanationReleaseAt: string | null;
            rankingReleaseAt: string | null;
            resultsReleased: boolean;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            syllabus: {
                id: string;
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            duration: number;
            durationMinutes: number;
            attemptLimit: number;
            maxAttempts: number;
            startTime: Date | null | undefined;
            endTime: Date | null | undefined;
            availableFrom: string | undefined;
            availableUntil: string | undefined;
            latestStartAt: string | null;
            openAt: string | undefined;
            closeAt: string | undefined;
            isoDate: string;
            published: boolean;
            audienceRules: {
                gradeIds: number[];
                educationTypeIds: string[];
                trackIds: string[];
                learnerProfiles: string[];
                independentTypes: string[];
            };
            questions: {
                id: string;
                text: string;
                question: string;
                options: string[];
                correctAnswer: string;
                correctOption: string;
                explanation: string;
                subject: string;
                topic: string;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[] | undefined;
            delivery: {
                questionCount: number;
                assignmentCount: number;
                attemptCount: number;
                activeAttemptCount: number;
                completedAttemptCount: number;
                notStartedCount: number;
                allowedAttempts: number;
                attemptsUsed: number;
                activeAttemptId: string | null;
                canStart: boolean;
                reason: string | undefined;
                state: string;
                lastAttempt: {
                    id: string;
                    examId: string;
                    title: string;
                    status: string;
                    score: number | null;
                    subjectSummary: {
                        percentage: number;
                        correct: number;
                        wrong: number;
                        unanswered: number;
                        total: number;
                        subject: string;
                    }[] | undefined;
                    startedAt: Date;
                    finishedAt: Date | null;
                    answeredCount: number;
                } | null;
            };
        }[];
    }>;
    addQuestionCanonical(user: AuthenticatedUser, id: string, dto: CreateQuestionDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            text: string;
            question: string;
            options: string[];
            correctAnswer: string;
            correctOption: string;
            explanation: string;
            subject: string;
            topic: string;
            sectionId: string;
            mediaUrl: string;
            difficulty: string;
            source: string;
            tags: string[];
        };
    }>;
    updateQuestionCanonical(user: AuthenticatedUser, id: string, dto: CreateQuestionDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            text: string;
            question: string;
            options: string[];
            correctAnswer: string;
            correctOption: string;
            explanation: string;
            subject: string;
            topic: string;
            sectionId: string;
            mediaUrl: string;
            difficulty: string;
            source: string;
            tags: string[];
        };
    }>;
    deleteQuestionCanonical(user: AuthenticatedUser, examId: string, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    assign(user: AuthenticatedUser, id: string, dto: AssignExamDto): Promise<{
        ok: boolean;
        data: {
            examId: string;
            studentIds: string[];
        };
    }>;
    assignments(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            assignedAt: Date;
            source: "direct";
            student: {
                id: string;
                name: string;
                grade: string;
                major: string;
            };
            assignedBy: {
                id: string;
                name: string;
            } | null;
        }[];
    }>;
    classAssignments(user: AuthenticatedUser, id: string): Promise<{
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
    setClassAssignments(user: AuthenticatedUser, id: string, dto: ExamClassAssignmentsDto): Promise<{
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
    setAudienceRules(user: AuthenticatedUser, id: string, dto: ExamAudienceRulesDto): Promise<{
        ok: boolean;
        data: {
            gradeIds: number[];
            educationTypeIds: string[];
            trackIds: string[];
            learnerProfiles: string[];
            independentTypes: string[];
        };
    }>;
    unassign(user: AuthenticatedUser, id: string, studentId: string): Promise<{
        ok: boolean;
        data: {
            examId: string;
            studentId: string;
            removed: boolean;
        };
    }>;
    staffStudentAttempts(user: AuthenticatedUser, studentId: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            examId: string;
            title: string;
            status: string;
            score: number | null;
            subjectSummary: {
                percentage: number;
                correct: number;
                wrong: number;
                unanswered: number;
                total: number;
                subject: string;
            }[] | undefined;
            startedAt: Date;
            finishedAt: Date | null;
            answeredCount: number;
        }[];
    }>;
    staffStudentAttempt(user: AuthenticatedUser, studentId: string, attemptId: string): Promise<{
        ok: boolean;
        data: {
            studentId: string;
            result: {
                id: string;
                status: "calculating" | "released" | "withheld";
                score: number | null;
                taraz: null;
                rank: null;
                percentile: null;
                correct: number | undefined;
                wrong: number | undefined;
                unanswered: number | undefined;
                total: number;
                subjects: {
                    percentage: number;
                    correct: number;
                    wrong: number;
                    unanswered: number;
                    total: number;
                    rawScore: number;
                    maximum: number;
                    subject: string;
                }[] | undefined;
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
                }[] | undefined;
                finishedAt: Date | null | undefined;
                answerKeyReleased: boolean;
                explanationsReleased: boolean;
                review: {
                    questionId: string;
                    question: string;
                    selectedOption: string | null;
                    correctOption: string;
                    explanation: string | undefined;
                    isCorrect: boolean;
                    subject: string;
                    topic: string;
                }[] | undefined;
            };
            id: string;
            examId: string;
            title: string;
            status: string;
            score: number | null;
            subjectSummary: {
                percentage: number;
                correct: number;
                wrong: number;
                unanswered: number;
                total: number;
                subject: string;
            }[] | undefined;
            startedAt: Date;
            finishedAt: Date | null;
            answeredCount: number;
        };
    }>;
    private requireExamScope;
    private requireStudentScope;
    listForStudent(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            serverTime: string;
            id: string;
            title: string;
            description: string;
            subject: string;
            subjects: string[];
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: string;
            updatedAt: string;
            mode: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
            status: string;
            instructions: string[];
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            allowResume: boolean;
            allowLateStart: boolean;
            allowPracticeAfterDeadline: boolean;
            autoSubmitOnTimeout: boolean;
            sessionPolicy: "single_session" | "allow_resume";
            integrityMonitoring: boolean;
            scoring: {
                correct: number;
                wrong: number;
                unanswered: number;
                negativeMarking: boolean;
            };
            resultPolicy: "scheduled" | "immediate" | "manual";
            resultReleaseAt: string | null;
            answerKeyReleaseAt: string | null;
            explanationReleaseAt: string | null;
            rankingReleaseAt: string | null;
            resultsReleased: boolean;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            syllabus: {
                id: string;
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            duration: number;
            durationMinutes: number;
            attemptLimit: number;
            maxAttempts: number;
            startTime: Date | null | undefined;
            endTime: Date | null | undefined;
            availableFrom: string | undefined;
            availableUntil: string | undefined;
            latestStartAt: string | null;
            openAt: string | undefined;
            closeAt: string | undefined;
            isoDate: string;
            published: boolean;
            audienceRules: {
                gradeIds: number[];
                educationTypeIds: string[];
                trackIds: string[];
                learnerProfiles: string[];
                independentTypes: string[];
            };
            questions: {
                id: string;
                text: string;
                question: string;
                options: string[];
                correctAnswer: string;
                correctOption: string;
                explanation: string;
                subject: string;
                topic: string;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[] | undefined;
            delivery: {
                questionCount: number;
                assignmentCount: number;
                attemptCount: number;
                activeAttemptCount: number;
                completedAttemptCount: number;
                notStartedCount: number;
                allowedAttempts: number;
                attemptsUsed: number;
                activeAttemptId: string | null;
                canStart: boolean;
                reason: string | undefined;
                state: string;
                lastAttempt: {
                    id: string;
                    examId: string;
                    title: string;
                    status: string;
                    score: number | null;
                    subjectSummary: {
                        percentage: number;
                        correct: number;
                        wrong: number;
                        unanswered: number;
                        total: number;
                        subject: string;
                    }[] | undefined;
                    startedAt: Date;
                    finishedAt: Date | null;
                    answeredCount: number;
                } | null;
            };
        }[];
    }>;
    history(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            examId: string;
            title: string;
            status: string;
            score: number | null;
            subjectSummary: {
                percentage: number;
                correct: number;
                wrong: number;
                unanswered: number;
                total: number;
                subject: string;
            }[] | undefined;
            startedAt: Date;
            finishedAt: Date | null;
            answeredCount: number;
        }[];
    }>;
    resultForStudent(id: string, user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: "calculating" | "released" | "withheld";
            score: number | null;
            taraz: null;
            rank: null;
            percentile: null;
            correct: number | undefined;
            wrong: number | undefined;
            unanswered: number | undefined;
            total: number;
            subjects: {
                percentage: number;
                correct: number;
                wrong: number;
                unanswered: number;
                total: number;
                rawScore: number;
                maximum: number;
                subject: string;
            }[] | undefined;
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
            }[] | undefined;
            finishedAt: Date | null | undefined;
            answerKeyReleased: boolean;
            explanationsReleased: boolean;
            review: {
                questionId: string;
                question: string;
                selectedOption: string | null;
                correctOption: string;
                explanation: string | undefined;
                isCorrect: boolean;
                subject: string;
                topic: string;
            }[] | undefined;
        };
    }>;
    progress(id: string, user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: "calculating" | "released" | "withheld";
            score: number | null;
            taraz: null;
            rank: null;
            percentile: null;
            correct: number | undefined;
            wrong: number | undefined;
            unanswered: number | undefined;
            total: number;
            subjects: {
                percentage: number;
                correct: number;
                wrong: number;
                unanswered: number;
                total: number;
                rawScore: number;
                maximum: number;
                subject: string;
            }[] | undefined;
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
            }[] | undefined;
            finishedAt: Date | null | undefined;
            answerKeyReleased: boolean;
            explanationsReleased: boolean;
            review: {
                questionId: string;
                question: string;
                selectedOption: string | null;
                correctOption: string;
                explanation: string | undefined;
                isCorrect: boolean;
                subject: string;
                topic: string;
            }[] | undefined;
        } | {
            runId: string;
            startedAt: Date;
            examCloseAt: Date | null;
            deadlineAt: string;
            serverTime: string;
            finishedAt: Date | null;
            savedAnswers: {
                clientUpdatedAt: string;
                revision: number;
                questionId: string;
                selectedOption?: string | null;
                marked?: boolean;
                visited?: boolean;
                approximateTimeSpentSeconds?: number;
            }[];
            remainingSeconds: number;
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            currentSectionId: string;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            quiz: {
                id: string;
                examId: string;
                title: string;
                durationMinutes: number;
                questions: {
                    id: string;
                    question: string;
                    options: [string, string, string, string];
                    subject: string;
                    topic: string;
                    sectionId: string;
                    mediaUrl: string;
                }[];
            };
        } | null;
    }>;
    detail(id: string, user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            serverTime: string;
            id: string;
            title: string;
            description: string;
            subject: string;
            subjects: string[];
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: string;
            updatedAt: string;
            mode: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
            status: string;
            instructions: string[];
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            allowResume: boolean;
            allowLateStart: boolean;
            allowPracticeAfterDeadline: boolean;
            autoSubmitOnTimeout: boolean;
            sessionPolicy: "single_session" | "allow_resume";
            integrityMonitoring: boolean;
            scoring: {
                correct: number;
                wrong: number;
                unanswered: number;
                negativeMarking: boolean;
            };
            resultPolicy: "scheduled" | "immediate" | "manual";
            resultReleaseAt: string | null;
            answerKeyReleaseAt: string | null;
            explanationReleaseAt: string | null;
            rankingReleaseAt: string | null;
            resultsReleased: boolean;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            syllabus: {
                id: string;
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            duration: number;
            durationMinutes: number;
            attemptLimit: number;
            maxAttempts: number;
            startTime: Date | null | undefined;
            endTime: Date | null | undefined;
            availableFrom: string | undefined;
            availableUntil: string | undefined;
            latestStartAt: string | null;
            openAt: string | undefined;
            closeAt: string | undefined;
            isoDate: string;
            published: boolean;
            audienceRules: {
                gradeIds: number[];
                educationTypeIds: string[];
                trackIds: string[];
                learnerProfiles: string[];
                independentTypes: string[];
            };
            questions: {
                id: string;
                text: string;
                question: string;
                options: string[];
                correctAnswer: string;
                correctOption: string;
                explanation: string;
                subject: string;
                topic: string;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[] | undefined;
            delivery: {
                questionCount: number;
                assignmentCount: number;
                attemptCount: number;
                activeAttemptCount: number;
                completedAttemptCount: number;
                notStartedCount: number;
                allowedAttempts: number;
                attemptsUsed: number;
                activeAttemptId: string | null;
                canStart: boolean;
                reason: string | undefined;
                state: string;
                lastAttempt: {
                    id: string;
                    examId: string;
                    title: string;
                    status: string;
                    score: number | null;
                    subjectSummary: {
                        percentage: number;
                        correct: number;
                        wrong: number;
                        unanswered: number;
                        total: number;
                        subject: string;
                    }[] | undefined;
                    startedAt: Date;
                    finishedAt: Date | null;
                    answeredCount: number;
                } | null;
            };
        };
    }>;
    saveProgress(id: string, dto: SubmitExamDto, user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            runId: string;
            startedAt: Date;
            examCloseAt: Date | null;
            deadlineAt: string;
            serverTime: string;
            finishedAt: Date | null;
            savedAnswers: {
                clientUpdatedAt: string;
                revision: number;
                questionId: string;
                selectedOption?: string | null;
                marked?: boolean;
                visited?: boolean;
                approximateTimeSpentSeconds?: number;
            }[];
            remainingSeconds: number;
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            currentSectionId: string;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            quiz: {
                id: string;
                examId: string;
                title: string;
                durationMinutes: number;
                questions: {
                    id: string;
                    question: string;
                    options: [string, string, string, string];
                    subject: string;
                    topic: string;
                    sectionId: string;
                    mediaUrl: string;
                }[];
            };
        };
    }>;
    start(id: string, user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            runId: string;
            startedAt: Date;
            examCloseAt: Date | null;
            deadlineAt: string;
            serverTime: string;
            finishedAt: Date | null;
            savedAnswers: {
                clientUpdatedAt: string;
                revision: number;
                questionId: string;
                selectedOption?: string | null;
                marked?: boolean;
                visited?: boolean;
                approximateTimeSpentSeconds?: number;
            }[];
            remainingSeconds: number;
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            currentSectionId: string;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            quiz: {
                id: string;
                examId: string;
                title: string;
                durationMinutes: number;
                questions: {
                    id: string;
                    question: string;
                    options: [string, string, string, string];
                    subject: string;
                    topic: string;
                    sectionId: string;
                    mediaUrl: string;
                }[];
            };
        };
    }>;
    submit(id: string, dto: SubmitExamDto, user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: "calculating" | "released" | "withheld";
            score: number | null;
            taraz: null;
            rank: null;
            percentile: null;
            correct: number | undefined;
            wrong: number | undefined;
            unanswered: number | undefined;
            total: number;
            subjects: {
                percentage: number;
                correct: number;
                wrong: number;
                unanswered: number;
                total: number;
                rawScore: number;
                maximum: number;
                subject: string;
            }[] | undefined;
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
            }[] | undefined;
            finishedAt: Date | null | undefined;
            answerKeyReleased: boolean;
            explanationsReleased: boolean;
            review: {
                questionId: string;
                question: string;
                selectedOption: string | null;
                correctOption: string;
                explanation: string | undefined;
                isCorrect: boolean;
                subject: string;
                topic: string;
            }[] | undefined;
        };
    }>;
    heartbeat(examId: string, attemptId: string, dto: ExamHeartbeatDto, user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            attemptId: string;
            status: string;
            serverTime: string;
            expiresAt: string;
        };
    }>;
    create(dto: CreateExamDto): Promise<{
        ok: boolean;
        data: {
            serverTime: string;
            id: string;
            title: string;
            description: string;
            subject: string;
            subjects: string[];
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: string;
            updatedAt: string;
            mode: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
            status: string;
            instructions: string[];
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            allowResume: boolean;
            allowLateStart: boolean;
            allowPracticeAfterDeadline: boolean;
            autoSubmitOnTimeout: boolean;
            sessionPolicy: "single_session" | "allow_resume";
            integrityMonitoring: boolean;
            scoring: {
                correct: number;
                wrong: number;
                unanswered: number;
                negativeMarking: boolean;
            };
            resultPolicy: "scheduled" | "immediate" | "manual";
            resultReleaseAt: string | null;
            answerKeyReleaseAt: string | null;
            explanationReleaseAt: string | null;
            rankingReleaseAt: string | null;
            resultsReleased: boolean;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            syllabus: {
                id: string;
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            duration: number;
            durationMinutes: number;
            attemptLimit: number;
            maxAttempts: number;
            startTime: Date | null | undefined;
            endTime: Date | null | undefined;
            availableFrom: string | undefined;
            availableUntil: string | undefined;
            latestStartAt: string | null;
            openAt: string | undefined;
            closeAt: string | undefined;
            isoDate: string;
            published: boolean;
            audienceRules: {
                gradeIds: number[];
                educationTypeIds: string[];
                trackIds: string[];
                learnerProfiles: string[];
                independentTypes: string[];
            };
            questions: {
                id: string;
                text: string;
                question: string;
                options: string[];
                correctAnswer: string;
                correctOption: string;
                explanation: string;
                subject: string;
                topic: string;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[] | undefined;
            delivery: {
                questionCount: number;
                assignmentCount: number;
                attemptCount: number;
                activeAttemptCount: number;
                completedAttemptCount: number;
                notStartedCount: number;
                allowedAttempts: number;
                attemptsUsed: number;
                activeAttemptId: string | null;
                canStart: boolean;
                reason: string | undefined;
                state: string;
                lastAttempt: {
                    id: string;
                    examId: string;
                    title: string;
                    status: string;
                    score: number | null;
                    subjectSummary: {
                        percentage: number;
                        correct: number;
                        wrong: number;
                        unanswered: number;
                        total: number;
                        subject: string;
                    }[] | undefined;
                    startedAt: Date;
                    finishedAt: Date | null;
                    answeredCount: number;
                } | null;
            };
        };
    }>;
    listForAdmin(_studentId?: string): Promise<{
        ok: boolean;
        data: {
            serverTime: string;
            id: string;
            title: string;
            description: string;
            subject: string;
            subjects: string[];
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: string;
            updatedAt: string;
            mode: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
            status: string;
            instructions: string[];
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            allowResume: boolean;
            allowLateStart: boolean;
            allowPracticeAfterDeadline: boolean;
            autoSubmitOnTimeout: boolean;
            sessionPolicy: "single_session" | "allow_resume";
            integrityMonitoring: boolean;
            scoring: {
                correct: number;
                wrong: number;
                unanswered: number;
                negativeMarking: boolean;
            };
            resultPolicy: "scheduled" | "immediate" | "manual";
            resultReleaseAt: string | null;
            answerKeyReleaseAt: string | null;
            explanationReleaseAt: string | null;
            rankingReleaseAt: string | null;
            resultsReleased: boolean;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            syllabus: {
                id: string;
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            duration: number;
            durationMinutes: number;
            attemptLimit: number;
            maxAttempts: number;
            startTime: Date | null | undefined;
            endTime: Date | null | undefined;
            availableFrom: string | undefined;
            availableUntil: string | undefined;
            latestStartAt: string | null;
            openAt: string | undefined;
            closeAt: string | undefined;
            isoDate: string;
            published: boolean;
            audienceRules: {
                gradeIds: number[];
                educationTypeIds: string[];
                trackIds: string[];
                learnerProfiles: string[];
                independentTypes: string[];
            };
            questions: {
                id: string;
                text: string;
                question: string;
                options: string[];
                correctAnswer: string;
                correctOption: string;
                explanation: string;
                subject: string;
                topic: string;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[] | undefined;
            delivery: {
                questionCount: number;
                assignmentCount: number;
                attemptCount: number;
                activeAttemptCount: number;
                completedAttemptCount: number;
                notStartedCount: number;
                allowedAttempts: number;
                attemptsUsed: number;
                activeAttemptId: string | null;
                canStart: boolean;
                reason: string | undefined;
                state: string;
                lastAttempt: {
                    id: string;
                    examId: string;
                    title: string;
                    status: string;
                    score: number | null;
                    subjectSummary: {
                        percentage: number;
                        correct: number;
                        wrong: number;
                        unanswered: number;
                        total: number;
                        subject: string;
                    }[] | undefined;
                    startedAt: Date;
                    finishedAt: Date | null;
                    answeredCount: number;
                } | null;
            };
        }[];
    }>;
    update(id: string, body: Record<string, unknown>): Promise<{
        ok: boolean;
        data: {
            serverTime: string;
            id: string;
            title: string;
            description: string;
            subject: string;
            subjects: string[];
            organization: {
                id: string;
                name: string;
            } | null;
            createdAt: string;
            updatedAt: string;
            mode: "konkur" | "mock" | "practice" | "quiz" | "diagnostic";
            status: string;
            instructions: string[];
            allowBackNavigation: boolean;
            navigationMode: "free" | "section_only" | "sequential";
            timerMode: "whole_exam" | "per_section";
            allowResume: boolean;
            allowLateStart: boolean;
            allowPracticeAfterDeadline: boolean;
            autoSubmitOnTimeout: boolean;
            sessionPolicy: "single_session" | "allow_resume";
            integrityMonitoring: boolean;
            scoring: {
                correct: number;
                wrong: number;
                unanswered: number;
                negativeMarking: boolean;
            };
            resultPolicy: "scheduled" | "immediate" | "manual";
            resultReleaseAt: string | null;
            answerKeyReleaseAt: string | null;
            explanationReleaseAt: string | null;
            rankingReleaseAt: string | null;
            resultsReleased: boolean;
            sections: {
                id: string;
                name: string;
                order?: number;
                questionIds: string[];
                allocatedMinutes?: number;
                navigationMode?: "free" | "section_only" | "sequential";
            }[];
            syllabus: {
                id: string;
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            duration: number;
            durationMinutes: number;
            attemptLimit: number;
            maxAttempts: number;
            startTime: Date | null | undefined;
            endTime: Date | null | undefined;
            availableFrom: string | undefined;
            availableUntil: string | undefined;
            latestStartAt: string | null;
            openAt: string | undefined;
            closeAt: string | undefined;
            isoDate: string;
            published: boolean;
            audienceRules: {
                gradeIds: number[];
                educationTypeIds: string[];
                trackIds: string[];
                learnerProfiles: string[];
                independentTypes: string[];
            };
            questions: {
                id: string;
                text: string;
                question: string;
                options: string[];
                correctAnswer: string;
                correctOption: string;
                explanation: string;
                subject: string;
                topic: string;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                tags: string[];
            }[] | undefined;
            delivery: {
                questionCount: number;
                assignmentCount: number;
                attemptCount: number;
                activeAttemptCount: number;
                completedAttemptCount: number;
                notStartedCount: number;
                allowedAttempts: number;
                attemptsUsed: number;
                activeAttemptId: string | null;
                canStart: boolean;
                reason: string | undefined;
                state: string;
                lastAttempt: {
                    id: string;
                    examId: string;
                    title: string;
                    status: string;
                    score: number | null;
                    subjectSummary: {
                        percentage: number;
                        correct: number;
                        wrong: number;
                        unanswered: number;
                        total: number;
                        subject: string;
                    }[] | undefined;
                    startedAt: Date;
                    finishedAt: Date | null;
                    answeredCount: number;
                } | null;
            };
        };
    }>;
    remove(id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    listQuestions(id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            text: string;
            question: string;
            options: string[];
            correctAnswer: string;
            correctOption: string;
            explanation: string;
            subject: string;
            topic: string;
            sectionId: string;
            mediaUrl: string;
            difficulty: string;
            source: string;
            tags: string[];
        }[];
    }>;
    addQuestion(id: string, dto: CreateQuestionDto & {
        question?: string;
        correctOption?: string;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            text: string;
            question: string;
            options: string[];
            correctAnswer: string;
            correctOption: string;
            explanation: string;
            subject: string;
            topic: string;
            sectionId: string;
            mediaUrl: string;
            difficulty: string;
            source: string;
            tags: string[];
        };
    }>;
    updateQuestion(id: string, body: Record<string, unknown>): Promise<{
        ok: boolean;
        data: {
            id: string;
            text: string;
            question: string;
            options: string[];
            correctAnswer: string;
            correctOption: string;
            explanation: string;
            subject: string;
            topic: string;
            sectionId: string;
            mediaUrl: string;
            difficulty: string;
            source: string;
            tags: string[];
        };
    }>;
    deleteQuestion(id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    deleteExamQuestion(examId: string, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    studentAttempts(studentId: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            examId: string;
            title: string;
            status: string;
            score: number | null;
            subjectSummary: {
                percentage: number;
                correct: number;
                wrong: number;
                unanswered: number;
                total: number;
                subject: string;
            }[] | undefined;
            startedAt: Date;
            finishedAt: Date | null;
            answeredCount: number;
        }[];
    }>;
    studentAttempt(studentId: string, attemptId: string): Promise<{
        ok: boolean;
        data: {
            studentId: string;
            result: {
                id: string;
                status: "calculating" | "released" | "withheld";
                score: number | null;
                taraz: null;
                rank: null;
                percentile: null;
                correct: number | undefined;
                wrong: number | undefined;
                unanswered: number | undefined;
                total: number;
                subjects: {
                    percentage: number;
                    correct: number;
                    wrong: number;
                    unanswered: number;
                    total: number;
                    rawScore: number;
                    maximum: number;
                    subject: string;
                }[] | undefined;
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
                }[] | undefined;
                finishedAt: Date | null | undefined;
                answerKeyReleased: boolean;
                explanationsReleased: boolean;
                review: {
                    questionId: string;
                    question: string;
                    selectedOption: string | null;
                    correctOption: string;
                    explanation: string | undefined;
                    isCorrect: boolean;
                    subject: string;
                    topic: string;
                }[] | undefined;
            };
            id: string;
            examId: string;
            title: string;
            status: string;
            score: number | null;
            subjectSummary: {
                percentage: number;
                correct: number;
                wrong: number;
                unanswered: number;
                total: number;
                subject: string;
            }[] | undefined;
            startedAt: Date;
            finishedAt: Date | null;
            answeredCount: number;
        };
    }>;
    importQuestions(body: {
        examId: string;
        questions: CreateQuestionDto[];
    }): Promise<{
        ok: boolean;
        data: import("../../database/entities").Question[];
    }>;
}
