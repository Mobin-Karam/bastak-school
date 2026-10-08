import { Organization } from "./organization.entity";
import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare enum RelationshipType {
    GUARDIAN_OF = "GUARDIAN_OF",
    ADVISOR_OF = "ADVISOR_OF",
    TEACHER_OF = "TEACHER_OF",
    MENTOR_OF = "MENTOR_OF"
}
export declare enum RelationshipStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    REJECTED = "REJECTED",
    REVOKED = "REVOKED"
}
export declare class UserRelationship {
    id: string;
    fromUser: User;
    toStudent: Student;
    organization?: Organization | null;
    type: RelationshipType;
    status: RelationshipStatus;
    createdAt: Date;
    updatedAt: Date;
    acceptedAt?: Date | null;
    revokedAt?: Date | null;
}
