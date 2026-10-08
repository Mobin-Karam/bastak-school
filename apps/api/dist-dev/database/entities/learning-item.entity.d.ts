import { Student } from "./student.entity";
import { LearningReview } from "./learning-review.entity";
export declare enum LearningStatus {
    PENDING = "pending",
    DONE = "done",
    ARCHIVED = "archived"
}
export declare class LearningItem {
    id: string;
    student: Student;
    subject: string;
    book: string;
    chapter: string;
    lesson: string;
    topic: string;
    title: string;
    note: string;
    hint: string;
    dueDate: string;
    intervalDays: number;
    reviewCount: number;
    mastery: number;
    status: LearningStatus;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    reviews: LearningReview[];
}
