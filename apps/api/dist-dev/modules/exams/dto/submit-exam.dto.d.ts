export declare class ExamAnswerDto {
    questionId: string;
    selectedOption?: string | null;
    marked?: boolean;
    visited?: boolean;
    clientUpdatedAt?: string;
    revision?: number;
    approximateTimeSpentSeconds?: number;
}
export declare class SubmitExamDto {
    answers: ExamAnswerDto[];
}
export declare class ExamHeartbeatDto {
    currentSectionId?: string;
}
