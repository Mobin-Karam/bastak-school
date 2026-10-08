import { Student } from "./student.entity";
import { Task } from "./task.entity";
export declare enum PlanStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class Plan {
    id: string;
    student: Student;
    date: string;
    status: PlanStatus;
    title: string;
    dayLabel: string;
    persianDate: string;
    jalaliId: string;
    motivationText: string;
    templateId?: string | null;
    templateVersion?: number | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    tasks: Task[];
}
