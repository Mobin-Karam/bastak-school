export declare class LoginThrottle {
    id: string;
    key: string;
    attempts: number;
    windowStartedAt: Date;
    lockedUntil?: Date | null;
    updatedAt: Date;
}
