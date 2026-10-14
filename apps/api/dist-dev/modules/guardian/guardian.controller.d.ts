import { AuthenticatedUser } from "../auth";
import { GuardianService } from "./guardian.service";
declare class EncouragementDto {
    message: string;
    kind?: string;
}
export declare class GuardianController {
    private guardian;
    constructor(guardian: GuardianService);
    students(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            grade: string;
            major: string;
            targetUniversity: string;
            targetField: string;
        }[];
    }>;
    dashboard(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            student: {
                id: string;
                name: string;
                grade: string;
                major: string;
                targetUniversity: string;
                targetField: string;
            };
            today: {
                date: string;
                totalTasks: number;
                completedTasks: number;
            };
            weekly: {
                from: string;
                to: string;
                totalTasks: number;
                completedTasks: number;
                completionPercent: number;
                studyMinutes: number;
            };
            upcomingExams: {
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
            schedule: {
                id: string;
                date: string;
                tasks: {
                    id: string;
                    title: string;
                    subject: string;
                    startTime: string;
                    endTime: string;
                    duration: number;
                    status: string;
                    completed: boolean;
                }[];
            }[];
            attention: {
                type: string;
                message: string;
            }[];
        };
    }>;
    progress(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            studentId: string;
            today: {
                date: string;
                totalTasks: number;
                completedTasks: number;
            };
            weekly: {
                from: string;
                to: string;
                totalTasks: number;
                completedTasks: number;
                completionPercent: number;
                studyMinutes: number;
            };
        };
    }>;
    schedule(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            date: string;
            tasks: {
                id: string;
                title: string;
                subject: string;
                startTime: string;
                endTime: string;
                duration: number;
                status: string;
                completed: boolean;
            }[];
        }[];
    }>;
    attendance(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            status: import("../../database/entities").AttendanceStatus;
            note: string;
            sessionDate: string;
            organizationId: string;
            recordedAt: string;
        }[];
    }>;
    exams(u: AuthenticatedUser, id: string): Promise<{
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
    reports(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            planDate: string;
            studyHours: number;
            tests: number;
            correct: number;
            wrong: number;
            blank: number;
            focus: number;
            fatigue: number;
            motivation: number;
        }[];
    }>;
    encourage(u: AuthenticatedUser, id: string, body: EncouragementDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            createdAt: Date;
        };
    }>;
}
export {};
