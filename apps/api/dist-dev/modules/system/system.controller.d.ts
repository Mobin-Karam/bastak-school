import { StreamableFile } from "@nestjs/common";
import { AuthenticatedUser } from "../auth";
import { SystemService } from "./system.service";
export declare class SystemController {
    private system;
    constructor(system: SystemService);
    version(app: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").AppVersion | {
            app: string;
            version: null;
            updatedAt: null;
        };
    }>;
    versions(): Promise<{
        ok: boolean;
        data: import("../../database/entities").AppVersion[];
    }>;
    setVersion(app: string, body: {
        version: string;
        notes?: string;
    }): Promise<{
        ok: boolean;
        data: import("../../database/entities").AppVersion;
    }>;
    releases(): Promise<{
        ok: boolean;
        data: import("../../database/entities").AppRelease[];
    }>;
    setRelease(app: string, body: {
        version: string;
        notes?: string;
    }): Promise<{
        ok: boolean;
        data: import("../../database/entities").AppRelease;
    }>;
    audit(): Promise<{
        ok: boolean;
        data: {
            id: string;
            action: string;
            entity: string;
            actorUserId: string | null;
            metadata: Record<string, unknown> | null;
            createdAt: Date;
        }[];
    }>;
    database(): Promise<{
        ok: boolean;
        data: {
            engine: string;
            status: string;
            sizeBytes: number;
            path: string;
            migrations: number;
            remoteRestoreEnabled: boolean;
        };
    }>;
    backup(user: AuthenticatedUser): Promise<StreamableFile>;
    restore(user: AuthenticatedUser, body: Buffer): Promise<{
        ok: boolean;
        data: {
            restored: boolean;
            sizeBytes: number;
            tables: number;
            rollbackFilename: string;
        };
    }>;
}
