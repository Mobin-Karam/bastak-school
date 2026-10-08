export declare enum StaffTaskIssueStatus {
    OPEN = "open",
    RESOLVED = "resolved",
    DISMISSED = "dismissed"
}
export declare class UpdateTaskIssueDto {
    status: StaffTaskIssueStatus;
    advisorNote?: string;
}
