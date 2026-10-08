import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare enum ExitPermissionStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    COMPLETED = "COMPLETED"
}
export declare class ExitPermission {
    id: string;
    organization: Organization;
    student: Student;
    requestedDepartureAt: Date;
    expectedReturnAt?: Date | null;
    actualDepartureAt?: Date | null;
    actualReturnAt?: Date | null;
    destination: string;
    reason: string;
    note: string;
    status: ExitPermissionStatus;
    approver?: User | null;
    reviewedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
