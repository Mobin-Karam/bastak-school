import { AttendanceSession } from "./attendance-session.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare enum AttendanceStatus {
    PRESENT = "present",
    ABSENT = "absent",
    LATE = "late",
    EXCUSED = "excused"
}
export declare enum AttendanceReviewStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class AttendanceRecord {
    id: string;
    session: AttendanceSession;
    student: Student;
    status: AttendanceStatus;
    note: string;
    reviewStatus?: AttendanceReviewStatus | null;
    reviewNote: string;
    reviewedBy?: User | null;
    reviewedAt?: Date | null;
    recordedBy?: User | null;
    createdAt: Date;
    updatedAt: Date;
}
