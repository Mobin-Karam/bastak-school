import { Repository } from "typeorm";
import { NotificationPreference } from "../../database/entities/notification-preference.entity";
import { PushSubscription } from "../../database/entities/push-subscription.entity";
import { User } from "../../database/entities/user.entity";
export declare class PushService {
    private subscriptions;
    private preferences;
    private users;
    readonly enabled: boolean;
    readonly publicKey: string;
    constructor(subscriptions: Repository<PushSubscription>, preferences: Repository<NotificationPreference>, users: Repository<User>);
    config(): {
        enabled: boolean;
        publicKey: string;
        supported: boolean;
        vapidPublicKey: string;
    };
    status(userId: string, endpoint?: string): Promise<{
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
    }>;
    subscribe(userId: string, body: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }, userAgent?: string): Promise<PushSubscription>;
    unsubscribe(userId: string, endpoint?: string): Promise<{
        removed: number;
    }>;
    setPreferences(userId: string, input: {
        enabled?: boolean;
        categories?: Record<string, boolean>;
        [key: string]: unknown;
    }): Promise<{
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
    }>;
    sendToUser(userId: string, n: {
        id?: string;
        title: string;
        body: string;
        category?: string;
        type?: string;
        url?: string | null;
    }): Promise<{
        sent: number;
        removed: number;
    }>;
}
