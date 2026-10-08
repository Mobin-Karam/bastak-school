import { Student } from "./student.entity";
export declare enum RecoveryRequestStatus {
    PENDING = "pending",
    RESOLVED = "resolved",
    DISMISSED = "dismissed"
}
export declare class RecoveryRequest {
    id: string;
    student: Student;
    planDate: string;
    reason: string;
    note: string;
    status: RecoveryRequestStatus;
    createdAt: Date;
    updatedAt: Date;
}
