import { Plan } from "./plan.entity";
export declare enum TaskType {
    STUDY = "STUDY",
    TEST = "TEST",
    REVIEW = "REVIEW",
    EXAM = "EXAM",
    REST = "REST",
    CUSTOM = "CUSTOM",
    CLASS = "CLASS",
    PRAYER = "PRAYER",
    MEAL = "MEAL",
    BREAK = "BREAK"
}
export declare class Task {
    id: string;
    plan: Plan;
    type: TaskType;
    title: string;
    subject: string;
    description: string;
    startTime: string;
    endTime: string;
    duration: number;
    testCount: number;
    note: string;
    status: string;
    priority: number;
    completedAt?: Date | null;
    actualMinutes: number;
    actualTests: number;
    completionDifficulty: string;
    completionNote: string;
    pages: string;
    examRef: string;
    examId: string;
    conflict: boolean;
    conflictGroup: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
