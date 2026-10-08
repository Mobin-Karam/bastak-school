import { Organization } from "./organization.entity";
import { User } from "./user.entity";
export declare enum RequestLetterStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    RECEIVED = "RECEIVED",
    UNDER_REVIEW = "UNDER_REVIEW",
    ANSWERED = "ANSWERED",
    REJECTED = "REJECTED",
    CLOSED = "CLOSED"
}
export declare class RequestLetter {
    id: string;
    organization: Organization;
    sender?: User | null;
    recipient?: User | null;
    recipientRole: string;
    subject: string;
    body: string;
    attachments: string[];
    status: RequestLetterStatus;
    priority: string;
    readAt?: Date | null;
    respondedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
