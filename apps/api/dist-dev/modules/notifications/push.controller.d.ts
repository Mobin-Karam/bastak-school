import { AuthenticatedUser } from "../auth";
import { NotificationsService } from "./notifications.service";
import { PushService } from "./push.service";
export declare class PushController {
    private push;
    private notifications;
    constructor(push: PushService, notifications: NotificationsService);
    config(): {
        ok: boolean;
        data: {
            enabled: boolean;
            publicKey: string;
            supported: boolean;
            vapidPublicKey: string;
        };
    };
    status(u: AuthenticatedUser, endpoint?: string): Promise<{
        ok: boolean;
        data: {
            serverConfigured: boolean;
            registered: boolean;
            preferences: {
                lessons: boolean;
                messages: boolean;
                exams: boolean;
                announcements: boolean;
            };
            devices: {
                id: string;
                userAgent: string;
                failureCount: number;
                lastSuccessAt: string | null;
                updatedAt: string;
                current: boolean;
            }[];
        };
    }>;
    subscribe(u: AuthenticatedUser, body: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }, agent?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").PushSubscription;
    }>;
    unsubscribe(u: AuthenticatedUser, endpoint?: string): Promise<{
        ok: boolean;
        data: {
            removed: number;
        };
    }>;
    preferences(u: AuthenticatedUser, body: {
        enabled?: boolean;
        categories?: Record<string, boolean>;
    }): Promise<{
        ok: boolean;
        data: {
            serverConfigured: boolean;
            registered: boolean;
            preferences: {
                lessons: boolean;
                messages: boolean;
                exams: boolean;
                announcements: boolean;
            };
            devices: {
                id: string;
                userAgent: string;
                failureCount: number;
                lastSuccessAt: string | null;
                updatedAt: string;
                current: boolean;
            }[];
        };
    }>;
    test(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            notificationId: string;
            pushConfigured: boolean;
        };
    }>;
}
