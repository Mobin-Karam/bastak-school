import { Student } from "./student.entity";
import { Task } from "./task.entity";
export declare class TaskIssue {
    id: string;
    task: Task;
    student: Student;
    type: string;
    description: string;
    status: string;
    advisorNote: string;
    createdAt: Date;
}
