import { User } from "./user.entity";
import { Organization } from "./organization.entity";
export declare enum NotificationType {
    PLAN_UPDATE = "PLAN_UPDATE",
    EXAM_REMINDER = "EXAM_REMINDER",
    MESSAGE = "MESSAGE",
    WARNING = "WARNING",
    MOTIVATION = "MOTIVATION"
}
export declare class Notification {
    id: string;
    user: User;
    organization?: Organization | null;
    type: string;
    title: string;
    body: string;
    category: string;
    url?: string | null;
    data?: Record<string, unknown> | null;
    priority: string;
    expiresAt?: Date | null;
    dedupeKey?: string | null;
    readAt?: Date | null;
    createdAt: Date;
}
