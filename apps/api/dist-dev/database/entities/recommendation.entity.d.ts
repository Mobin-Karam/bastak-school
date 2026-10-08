import { Student } from "./student.entity";
import { User } from "./user.entity";
export declare enum RecommendationStatus {
    PROPOSED = "PROPOSED",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED",
    DISMISSED = "DISMISSED"
}
export declare class Recommendation {
    id: string;
    student: Student;
    createdByType: string;
    createdByUser?: User | null;
    type: string;
    title: string;
    reason: string;
    evidence: Record<string, unknown>;
    status: RecommendationStatus;
    createdAt: Date;
    actedAt?: Date | null;
}
