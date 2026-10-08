import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare enum LeaveRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED"
}
export declare enum LeaveRequestType {
    SCHOOL_EXIT = "SCHOOL_EXIT",
    LEAVE = "LEAVE"
}
export declare enum LeaveRequestReviewerRole {
    PRINCIPAL = "PRINCIPAL",
    SCHOOL_SUPERVISOR = "SCHOOL_SUPERVISOR"
}
export declare class LeaveRequest {
    id: string;
    organization: Organization;
    student: Student;
    leaveType: string;
    reviewerRole: LeaveRequestReviewerRole;
    startDate: Date;
    endDate: Date;
    reason: string;
    note: string;
    attachments: string[];
    status: LeaveRequestStatus;
    approver?: User | null;
    reviewedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
