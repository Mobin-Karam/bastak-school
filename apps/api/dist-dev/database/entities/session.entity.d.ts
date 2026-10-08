import { User } from "./user.entity";
export declare class Session {
    id: string;
    user: User;
    tokenHash: string;
    refreshTokenHash: string | null;
    csrfToken: string;
    expiresAt: Date;
    refreshExpiresAt: Date | null;
    createdAt: Date;
}
