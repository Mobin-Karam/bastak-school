import { User } from "./user.entity";
import { LearningResourceAssignment } from "./learning-resource-assignment.entity";
export declare class LearningResource {
    id: string;
    title: string;
    description: string;
    type: "LINK" | "VIDEO";
    category: string;
    url: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    createdBy: User;
    assignments: LearningResourceAssignment[];
    createdAt: Date;
    updatedAt: Date;
}
