import { AuthenticatedUser } from "../auth";
import { ActivityService } from "./activity.service";
export declare class ActivityController {
    private activity;
    constructor(activity: ActivityService);
    private context;
    heartbeat(u: AuthenticatedUser, b: {
        state?: string;
        currentTaskId?: string | null;
        syncStatus?: string;
    }): Promise<{
        ok: boolean;
        data: {
            syncStatus: "offline" | "online" | "syncing" | "failed";
            online: boolean;
            state: string;
            lastSeenAt: Date;
            currentTask: {
                id: string;
                title: string;
            } | null;
        };
    }>;
    record(u: AuthenticatedUser, b: {
        type: string;
        resourceType?: string;
        resourceId?: string;
        data?: Record<string, unknown>;
    }): Promise<{
        ok: boolean;
        data: import("../../database/entities").ActivityEvent;
    }>;
    syncHealth(u: AuthenticatedUser, b: {
        deviceId?: string;
        status?: string;
        pendingCount?: number;
        failureCode?: string;
        correlationId?: string;
    }): Promise<{
        ok: boolean;
        data: {
            deviceId: string;
            correlationId: string | null;
            status: "offline" | "online" | "syncing" | "failed";
            pendingCount: number;
            failureCode: string | null;
            lastSuccessfulAt: string | null;
            updatedAt: string;
        };
    }>;
    syncHealthForStudent(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            deviceId: string;
            correlationId: string | null;
            status: "offline" | "online" | "syncing" | "failed";
            pendingCount: number;
            failureCode: string | null;
            lastSuccessfulAt: string | null;
            updatedAt: string;
        }[];
    }>;
    reviewSyncHealth(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            reviewed: boolean;
            devices: number;
        };
    }>;
    history(u: AuthenticatedUser, id: string, limit?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").ActivityEvent[];
    }>;
    live(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            grade: string;
            major: string;
            presence: {
                syncStatus: "offline" | "online" | "syncing" | "failed";
                online: boolean;
                state: string;
                lastSeenAt: Date;
                currentTask: {
                    id: string;
                    title: string;
                } | null;
            } | {
                online: boolean;
                state: string;
                lastSeenAt: null;
                currentTask: null;
            };
            attention: {
                score: number;
                signals: {
                    type: string;
                    count: any;
                    weight: number;
                }[];
            };
        }[];
    }>;
    attention(u: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            grade: string;
            major: string;
            presence: {
                syncStatus: "offline" | "online" | "syncing" | "failed";
                online: boolean;
                state: string;
                lastSeenAt: Date;
                currentTask: {
                    id: string;
                    title: string;
                } | null;
            } | {
                online: boolean;
                state: string;
                lastSeenAt: null;
                currentTask: null;
            };
            attention: {
                score: number;
                signals: {
                    type: string;
                    count: any;
                    weight: number;
                }[];
            };
        }[];
    }>;
}
