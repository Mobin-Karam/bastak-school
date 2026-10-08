import { LearningStatus } from "../../../database/entities/learning-item.entity";
export declare class CreateLearningItemDto {
    title: string;
    subject?: string;
    book?: string;
    chapter?: string;
    lesson?: string;
    topic?: string;
    note?: string;
    hint?: string;
    dueDate?: string;
}
export declare class UpdateLearningItemDto extends CreateLearningItemDto {
    title: string;
    status?: LearningStatus;
}
export declare class ReviewLearningItemDto {
    rating: number;
}
