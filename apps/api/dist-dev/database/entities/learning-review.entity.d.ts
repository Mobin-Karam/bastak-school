import { LearningItem } from "./learning-item.entity";
export declare class LearningReview {
    id: string;
    item: LearningItem;
    rating: number;
    previousMastery: number;
    newMastery: number;
    previousIntervalDays: number;
    nextIntervalDays: number;
    nextReviewAt: string;
    reviewedAt: Date;
}
