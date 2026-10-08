import { AuthenticatedUser } from "../auth";
import { NotificationsService } from "./notifications.service";
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    list(user: AuthenticatedUser, limit?: string, cursor?: string, unreadOnly?: string, category?: string): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    read(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
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
        };
    }>;
    readAll(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            updated: number;
        };
    }>;
}
