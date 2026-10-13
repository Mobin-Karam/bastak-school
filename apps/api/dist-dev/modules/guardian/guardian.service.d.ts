import { Repository } from "typeorm";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { AttendanceRecord } from "../../database/entities/attendance-record.entity";
import { DailyReport } from "../../database/entities/daily-report.entity";
import { Encouragement } from "../../database/entities/encouragement.entity";
import { ExamAssignment } from "../../database/entities/exam-assignment.entity";
import { Plan } from "../../database/entities/plan.entity";
import { Student } from "../../database/entities/student.entity";
import { StudySession } from "../../database/entities/study-session.entity";
import { User } from "../../database/entities/user.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService } from "../authorization";
import { ExamsService } from "../exams";
import { NotificationsService } from "../notifications";
export declare class GuardianService {
    private relationships;
    private studentsRepo;
    private plans;
    private sessions;
    private assignments;
    private reportsRepo;
    private encouragements;
    private users;
    private audit;
    private attendanceRecords;
    private notifications;
    private examsService;
    private authorization;
    constructor(relationships: Repository<UserRelationship>, studentsRepo: Repository<Student>, plans: Repository<Plan>, sessions: Repository<StudySession>, assignments: Repository<ExamAssignment>, reportsRepo: Repository<DailyReport>, encouragements: Repository<Encouragement>, users: Repository<User>, audit: Repository<AuditLog>, attendanceRecords: Repository<AttendanceRecord>, notifications: NotificationsService, examsService: ExamsService, authorization: AuthorizationService);
    students(user: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        grade: string;
        major: string;
        targetUniversity: string;
        targetField: string;
    }[]>;
    dashboard(user: AuthenticatedUser, studentId: string): Promise<{
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
            sessionPolicy: "allow_resume" | "single_session";
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
    }>;
    progress(user: AuthenticatedUser, studentId: string): Promise<{
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
    }>;
    schedule(user: AuthenticatedUser, studentId: string): Promise<{
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
    }[]>;
    attendance(user: AuthenticatedUser, studentId: string): Promise<{
        id: string;
        status: import("../../database/entities/attendance-record.entity").AttendanceStatus;
        note: string;
        sessionDate: string;
        organizationId: string;
        recordedAt: string;
    }[]>;
    exams(user: AuthenticatedUser, studentId: string): Promise<{
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
        sessionPolicy: "allow_resume" | "single_session";
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
    }[]>;
    reports(user: AuthenticatedUser, studentId: string): Promise<{
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
    }[]>;
    encourage(user: AuthenticatedUser, studentId: string, input: {
        message: string;
        kind?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
    }>;
    private requireChild;
    private studentProjection;
    private context;
}
