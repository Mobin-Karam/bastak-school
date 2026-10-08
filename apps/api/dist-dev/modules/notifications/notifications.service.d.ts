import { Repository } from "typeorm";
import { Notification, NotificationType } from "../../database/entities/notification.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { RealtimeService } from "../realtime";
import { PushService } from "./push.service";
export type CreateNotificationInput = {
    type: NotificationType | string;
    category?: string;
    title: string;
    body: string;
    url?: string;
    data?: Record<string, unknown>;
    priority?: string;
    expiresAt?: Date;
    dedupeKey?: string;
};
export declare class NotificationsService {
    private notifications;
    private students;
    private realtime;
    private users?;
    private push?;
    constructor(notifications: Repository<Notification>, students: Repository<Student>, realtime: RealtimeService, users?: Repository<User> | undefined, push?: PushService | undefined);
    createForUser(userId: string, input: CreateNotificationInput): Promise<Notification>;
    createForUsers(userIds: string[], input: CreateNotificationInput): Promise<Notification[]>;
    create(studentId: string, type: NotificationType, title: string, message: string): Promise<Notification>;
    findForUser(userId: string, options?: {
        limit?: number;
        cursor?: string;
        unreadOnly?: boolean;
        category?: string;
    }): Promise<{
        items: {
            id: string;
            type: unknown;
            category: string;
            title: string;
            body: string;
            message: string;
            url: string | null;
            data: unknown;
            priority: string;
            isRead: boolean;
            readAt: Date | null;
            createdAt: Date;
            expiresAt: Date | null;
        }[];
        unreadCount: number;
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    list(user: AuthenticatedUser, limit?: number): Promise<{
        items: {
            id: string;
            type: unknown;
            category: string;
            title: string;
            body: string;
            message: string;
            url: string | null;
            data: unknown;
            priority: string;
            isRead: boolean;
            readAt: Date | null;
            createdAt: Date;
            expiresAt: Date | null;
        }[];
        unreadCount: number;
        hasMore: boolean;
        nextCursor: string | null;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    markRead(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        type: unknown;
        category: string;
        title: string;
        body: string;
        message: string;
        url: string | null;
        data: unknown;
        priority: string;
        isRead: boolean;
        readAt: Date | null;
        createdAt: Date;
        expiresAt: Date | null;
    }>;
    markAllRead(user: AuthenticatedUser): Promise<{
        updated: number;
    }>;
    private publicNotification;
}
