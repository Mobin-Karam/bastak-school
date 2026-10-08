import { Student } from "./student.entity";
import { Task } from "./task.entity";
export declare class TaskComment {
    id: string;
    task: Task;
    student: Student;
    text: string;
    createdAt: Date;
}
