import { Student } from "./student.entity";
export declare class StudentSyncHealth {
    id: string;
    student: Student;
    deviceId: string;
    status: "online" | "syncing" | "failed" | "offline";
    pendingCount: number;
    failureCode?: string | null;
    correlationId?: string | null;
    lastSuccessfulAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
