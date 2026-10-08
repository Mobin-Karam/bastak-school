import { Organization } from "./organization.entity";
import { User } from "./user.entity";
export declare class ImportHistory {
    id: string;
    actor: User;
    organization?: Organization | null;
    schemaVersion: string;
    counts: Record<string, number>;
    result: string;
    errors?: string[] | null;
    createdAt: Date;
}
