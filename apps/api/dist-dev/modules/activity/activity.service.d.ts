import { OnModuleInit } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { ActivityEvent } from "../../database/entities/activity-event.entity";
import { Student } from "../../database/entities/student.entity";
import { StudentPresence } from "../../database/entities/student-presence.entity";
import { StudentSyncHealth } from "../../database/entities/student-sync-health.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { Task } from "../../database/entities/task.entity";
import { AuthorizationService, UserContext } from "../authorization";
export declare class ActivityService implements OnModuleInit {
    private presence;
    private syncHealthRepo;
    private audit;
    private events;
    private students;
    private tasks;
    private authorization;
    private db;
    private readonly logger;
    constructor(presence: Repository<StudentPresence>, syncHealthRepo: Repository<StudentSyncHealth>, audit: Repository<AuditLog>, events: Repository<ActivityEvent>, students: Repository<Student>, tasks: Repository<Task>, authorization: AuthorizationService, db: DataSource);
    onModuleInit(): Promise<void>;
    private student;
    heartbeat(userId: string, input: {
        state?: string;
        currentTaskId?: string | null;
        syncStatus?: string;
    }): Promise<{
        syncStatus: "offline" | "online" | "syncing" | "failed";
        online: boolean;
        state: string;
        lastSeenAt: Date;
        currentTask: {
            id: string;
            title: string;
        } | null;
    }>;
    record(userId: string, input: {
        type: string;
        resourceType?: string;
        resourceId?: string;
        data?: Record<string, unknown>;
    }): Promise<ActivityEvent>;
    reportSyncHealth(userId: string, input: {
        deviceId?: string;
        status?: string;
        pendingCount?: number;
        failureCode?: string;
        correlationId?: string;
    }): Promise<{
        deviceId: string;
        correlationId: string | null;
        status: "offline" | "online" | "syncing" | "failed";
        pendingCount: number;
        failureCode: string | null;
        lastSuccessfulAt: string | null;
        updatedAt: string;
    }>;
    syncHealth(context: UserContext, studentId: string): Promise<{
        deviceId: string;
        correlationId: string | null;
        status: "offline" | "online" | "syncing" | "failed";
        pendingCount: number;
        failureCode: string | null;
        lastSuccessfulAt: string | null;
        updatedAt: string;
    }[]>;
    reviewSyncHealth(context: UserContext, studentId: string): Promise<{
        reviewed: boolean;
        devices: number;
    }>;
    history(context: UserContext, studentId: string, limit?: number): Promise<ActivityEvent[]>;
    live(context: UserContext): Promise<{
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
    }[]>;
    attentionList(context: UserContext): Promise<{
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
    }[]>;
    private attention;
    private publicSyncHealth;
    private normalizeSyncFailureCode;
    private purgeStaleSyncHealth;
    private publicPresence;
}
