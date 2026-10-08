import { TaskType } from "../../../database/entities/task.entity";
export declare class ImportTaskDto {
    type: TaskType | string;
    title: string;
    description?: string;
    subject?: string;
    startTime?: string;
    start?: string;
    endTime?: string;
    end?: string;
    duration?: number;
    testCount?: number;
    priority?: number;
    note?: string;
    pages?: string;
    examRef?: string;
    examId?: string;
    conflict?: boolean;
    conflictGroup?: string;
}
export declare class ImportPlanDto {
    studentId: string;
    date?: string;
    planDate?: string;
    tasks: ImportTaskDto[];
    publish?: boolean;
    title?: string;
    dayLabel?: string;
    persianDate?: string;
    jalaliId?: string;
    motivationText?: string;
    templateId?: string;
    templateVersion?: number;
}
