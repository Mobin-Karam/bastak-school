import { Student } from "./student.entity";
import { Task } from "./task.entity";
export declare class StudentPresence {
    id: string;
    student: Student;
    state: string;
    syncStatus: "online" | "syncing" | "failed" | "offline";
    currentTask?: Task | null;
    lastSeenAt: Date;
    updatedAt: Date;
}
