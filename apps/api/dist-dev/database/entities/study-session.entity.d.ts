import { Student } from "./student.entity";
import { Task } from "./task.entity";
export declare enum StudySessionStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    FINISHED = "FINISHED"
}
export declare class StudySession {
    id: string;
    student: Student;
    task: Task;
    status: StudySessionStatus;
    startedAt: Date;
    lastStartedAt?: Date | null;
    lastHeartbeatAt?: Date | null;
    pausedAt?: Date | null;
    finishedAt?: Date | null;
    elapsedSeconds: number;
    actualTests: number;
    difficulty: string;
    note: string;
    createdAt: Date;
    updatedAt: Date;
}
