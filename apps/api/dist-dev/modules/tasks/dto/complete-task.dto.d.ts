export declare enum TaskCompletionStatus {
    DONE = "done",
    PARTIAL = "partial",
    SKIPPED = "skipped"
}
export declare class CompleteTaskDto {
    status?: TaskCompletionStatus;
    actualMinutes?: number;
    actualTests?: number;
    difficulty?: string;
    note?: string;
}
