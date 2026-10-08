import { User } from "./user.entity";
export declare class NotificationPreference {
    id: string;
    user: User;
    categories: Record<string, boolean>;
    enabled: boolean;
    updatedAt: Date;
}
