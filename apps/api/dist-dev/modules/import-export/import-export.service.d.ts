import { DataSource } from "typeorm";
import { TaskType } from "../../database/entities/task.entity";
import { AuthorizationService, UserContext } from "../authorization";
type Payload = {
    schemaVersion?: string;
    organizationId?: string;
    studentId?: string;
    scope?: string;
    publishImported?: unknown;
    replaceExistingPlans?: unknown;
    replaceExistingExams?: unknown;
    skipExistingPlans?: unknown;
    skipExistingExams?: unknown;
    sourceName?: string;
    student?: {
        id?: string;
    };
    plans?: Array<Record<string, unknown>>;
    exams?: Array<Record<string, unknown>>;
};
export declare class ImportExportService {
    private db;
    private authorization;
    constructor(db: DataSource, authorization: AuthorizationService);
    template(): {
        schemaVersion: string;
        organizationId: null;
        studentId: null;
        plans: {
            date: string;
            published: boolean;
            tasks: {
                type: string;
                title: string;
                subject: string;
                startTime: string;
                endTime: string;
                duration: number;
            }[];
        }[];
        exams: {
            title: string;
            subject: string;
            durationMinutes: number;
            maxAttempts: number;
            questions: {
                text: string;
                options: string[];
                correctAnswer: string;
                explanation: string;
            }[];
        }[];
    };
    preview(context: UserContext, payload: Payload): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
        conflicts: string[];
        summary: {
            conflicts: number;
            students: number;
            plans: number;
            tasks: number;
            exams: number;
            questions: number;
        };
        schemaVersion: string;
        normalized: {
            schemaVersion: string;
            organizationId: string | null;
            studentId: string | null;
            plans: {
                date: string;
                published: boolean;
                title: string;
                dayLabel: string;
                persianDate: string;
                jalaliId: string;
                motivationText: string;
                tasks: {
                    type: TaskType;
                    title: string;
                    subject: string;
                    description: string;
                    startTime: string;
                    endTime: string;
                    duration: number;
                    testCount: number;
                    note: string;
                    priority: number;
                    pages: string;
                    examRef: string;
                    examId: string;
                    conflict: boolean;
                    conflictGroup: string;
                }[];
            }[];
            exams: {
                title: string;
                subject: string;
                durationMinutes: number;
                maxAttempts: number;
                openAt: string | null;
                closeAt: string | null;
                questions: {
                    text: string;
                    options: string[];
                    correctAnswer: string;
                    explanation: string;
                    sortOrder: number;
                    subject: string;
                    topic: string;
                    book: string;
                    grade: string;
                    chapter: string;
                    lesson: string;
                    subtopic: string;
                    questionType: string;
                    weight: number;
                    sectionId: string;
                    mediaUrl: string;
                    difficulty: string;
                    source: string;
                    tags: string[];
                }[];
                externalRef: string;
                instructions: string[];
                syllabus: {
                    subject: string;
                    description: string;
                    required: boolean;
                    track: string;
                }[];
                published: boolean;
            }[];
            publishImported: boolean;
            replaceExistingPlans: boolean;
            replaceExistingExams: boolean;
            skipExistingPlans: boolean;
            skipExistingExams: boolean;
        };
    }>;
    commit(context: UserContext, actorId: string, payload: Payload): Promise<{
        historyId: string;
        importId: string;
        plans: number;
        tasks: number;
        exams: number;
        questions: number;
        skippedPlans: number;
        skippedExams: number;
        published: boolean;
        imported: {
            plans: number;
            exams: number;
            students: number;
            tasks: number;
            questions: number;
        };
    }>;
    export(context: UserContext, studentId?: string, organizationId?: string, scope?: string, from?: string, to?: string): Promise<{
        schemaVersion: string;
        exportedAt: string;
        organizationId: string | null;
        students: {
            id: string;
            name: string;
            grade: string;
            major: string;
        }[];
        plans: {
            studentId: string;
            date: string;
            published: boolean;
            title: string;
            dayLabel: string;
            persianDate: string;
            jalaliId: string;
            motivationText: string;
            tasks: {
                type: TaskType;
                title: string;
                subject: string;
                startTime: string;
                endTime: string;
                duration: number;
                testCount: number;
                note: string;
                priority: number;
                pages: string;
                examRef: string;
                examId: string;
                conflict: boolean;
                conflictGroup: string;
            }[];
        }[];
        exams: {
            title: string;
            subject: string;
            ref: string;
            durationMinutes: number;
            maxAttempts: number;
            openAt: Date | null | undefined;
            closeAt: Date | null | undefined;
            published: boolean;
            instructions: string[];
            syllabus: {
                subject: string;
                description: string;
                required: boolean;
                track: string;
            }[];
            questions: {
                text: string;
                options: string[];
                correctAnswer: string;
                explanation: string;
                subject: string;
                topic: string;
                book: string;
                grade: string;
                chapter: string;
                lesson: string;
                subtopic: string;
                questionType: string;
                weight: number;
                sectionId: string;
                mediaUrl: string;
                difficulty: string;
                source: string;
                sortOrder: number;
                tags: string[];
            }[];
        }[];
    }>;
    history(context: UserContext): Promise<{
        id: string;
        actorUserId: string;
        organizationId: string | null;
        schemaVersion: string;
        counts: Record<string, number>;
        timestamp: Date;
        result: string;
        errors: string[];
    }[]>;
    private validate;
    private validDate;
    private dateRange;
}
export {};
