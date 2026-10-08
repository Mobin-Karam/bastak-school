import { User } from "./user.entity";
export declare class AuditLog {
    id: string;
    user?: User | null;
    action: string;
    entity: string;
    organizationId?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt: Date;
}
