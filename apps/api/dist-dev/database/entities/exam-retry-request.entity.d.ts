import { Exam } from "./exam.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare enum RetryRequestStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class ExamRetryRequest {
    id: string;
    exam: Exam;
    student: Student;
    message: string;
    status: RetryRequestStatus;
    moderatorNote: string;
    resolvedBy?: User | null;
    resolvedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
