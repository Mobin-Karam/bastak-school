import { DataSource, Repository } from "typeorm";
import { AppRelease } from "../../database/entities/app-release.entity";
import { AppVersion } from "../../database/entities/app-version.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
export declare class SystemService {
    private db;
    private versions;
    private releases;
    private audits;
    private users;
    private restoring;
    constructor(db: DataSource, versions: Repository<AppVersion>, releases: Repository<AppRelease>, audits: Repository<AuditLog>, users: Repository<User>);
    publicVersion(app: string): Promise<AppVersion | {
        app: string;
        version: null;
        updatedAt: null;
    }>;
    listVersions(): Promise<AppVersion[]>;
    updateVersion(app: string, input: {
        version: string;
        notes?: string;
    }): Promise<AppVersion>;
    listReleases(): Promise<AppRelease[]>;
    updateRelease(app: string, input: {
        version: string;
        notes?: string;
    }): Promise<AppRelease>;
    auditLogs(): Promise<{
        id: string;
        action: string;
        entity: string;
        actorUserId: string | null;
        metadata: Record<string, unknown> | null;
        createdAt: Date;
    }[]>;
    metadata(): Promise<{
        engine: string;
        status: string;
        sizeBytes: number;
        path: string;
        migrations: number;
        remoteRestoreEnabled: boolean;
    }>;
    backup(actorId: string): Promise<{
        buffer: NonSharedBuffer;
        filename: string;
    }>;
    restore(actorId: string, buffer: Buffer): Promise<{
        restored: boolean;
        sizeBytes: number;
        tables: number;
        rollbackFilename: string;
    }>;
    resetSystemData(actor: AuthenticatedUser): Promise<{
        reset: boolean;
        retainedPlatformAccounts: number;
        clearedTables: number;
    }>;
    private identifier;
    private validate;
    private databasePath;
    private tempRoot;
    private audit;
}
