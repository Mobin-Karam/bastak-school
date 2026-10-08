import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare enum PermissionRequestStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare class PermissionRequest {
    id: string;
    organization: Organization;
    student: Student;
    kind: string;
    title: string;
    details: string;
    requestedFor?: Date | null;
    status: PermissionRequestStatus;
    supervisorNote: string;
    resolvedBy?: User | null;
    resolvedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
