import { Student } from "./student.entity";
export declare class ActivityEvent {
    id: string;
    student: Student;
    type: string;
    resourceType: string;
    resourceId: string;
    data?: Record<string, unknown> | null;
    createdAt: Date;
}
