import { AuthenticatedUser } from "../auth";
import { ImportExportService } from "./import-export.service";
export declare class ImportExportController {
    private transfer;
    constructor(transfer: ImportExportService);
    private context;
    private payload;
    exportData(user: AuthenticatedUser, studentId?: string, organizationId?: string, scope?: string, from?: string, to?: string): Promise<{
        ok: boolean;
        data: {
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
                    type: import("../../database/entities/task.entity").TaskType;
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
        };
    }>;
    template(): {
        ok: boolean;
        data: {
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
    };
    preview(user: AuthenticatedUser, body: Record<string, unknown>): Promise<{
        ok: boolean;
        data: {
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
                        type: import("../../database/entities/task.entity").TaskType;
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
        };
    }>;
    commit(user: AuthenticatedUser, body: Record<string, unknown>): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    history(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            actorUserId: string;
            organizationId: string | null;
            schemaVersion: string;
            counts: Record<string, number>;
            timestamp: Date;
            result: string;
            errors: string[];
        }[];
    }>;
}
