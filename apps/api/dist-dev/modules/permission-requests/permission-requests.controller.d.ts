import { PermissionRequestStatus } from "../../database/entities/permission-request.entity";
import { AuthenticatedUser } from "../auth";
import { PermissionRequestsService } from "./permission-requests.service";
export declare class PermissionRequestsController {
    private service;
    constructor(service: PermissionRequestsService);
    create(user: AuthenticatedUser, body: Record<string, string>): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            kind: string;
            title: string;
            details: string;
            requestedFor: string | null;
            status: PermissionRequestStatus;
            supervisorNote: string;
            resolvedAt: string | null;
            createdAt: string | null;
        };
    }>;
    mine(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            kind: string;
            title: string;
            details: string;
            requestedFor: string | null;
            status: PermissionRequestStatus;
            supervisorNote: string;
            resolvedAt: string | null;
            createdAt: string | null;
        }[];
    }>;
    list(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            kind: string;
            title: string;
            details: string;
            requestedFor: string | null;
            status: PermissionRequestStatus;
            supervisorNote: string;
            resolvedAt: string | null;
            createdAt: string | null;
        }[];
    }>;
    decide(user: AuthenticatedUser, id: string, body: {
        status?: PermissionRequestStatus;
        supervisorNote?: string;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            organizationId: string;
            organizationName: string;
            studentId: string;
            studentName: string;
            kind: string;
            title: string;
            details: string;
            requestedFor: string | null;
            status: PermissionRequestStatus;
            supervisorNote: string;
            resolvedAt: string | null;
            createdAt: string | null;
        };
    }>;
}
