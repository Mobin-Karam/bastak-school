import { User } from "./user.entity";
export declare class PushSubscription {
    id: string;
    user: User;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string;
    failureCount: number;
    lastSuccessAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
