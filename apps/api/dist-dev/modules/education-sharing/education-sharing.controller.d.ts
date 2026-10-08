import { AuthenticatedUser } from "../auth";
import { ShareEducationDto, SharePlanRangeDto } from "./education-sharing.dto";
import { EducationSharingService } from "./education-sharing.service";
export declare class EducationSharingController {
    private readonly sharing;
    constructor(sharing: EducationSharingService);
    peers(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            name: string;
            grade: string;
            organizationName: string;
        }[];
    }>;
    sharePlan(user: AuthenticatedUser, id: string, dto: ShareEducationDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").Plan;
    }>;
    sharePlanRange(user: AuthenticatedUser, id: string, dto: SharePlanRangeDto): Promise<{
        ok: boolean;
        data: {
            copied: number;
            skipped: number;
            source: {
                from: string;
                to: string;
                planCount: number;
            };
            targetStartDate: string;
            targetCount: number;
            conflictPolicy: "skip" | "overwrite";
        };
    }>;
    previewPlanRange(user: AuthenticatedUser, id: string, dto: SharePlanRangeDto): Promise<{
        ok: boolean;
        data: {
            source: {
                from: string;
                to: string;
                planCount: number;
            };
            targetStartDate: string;
            conflictPolicy: "skip" | "overwrite";
            recipients: {
                studentId: string;
                name: string;
                days: {
                    date: string;
                    sourceTaskCount: number;
                    existingPlan: boolean;
                    existingTaskCount: number;
                    timeConflicts: number;
                    examCollisions: number;
                    plannedMinutes: number;
                    overCapacity: boolean;
                }[];
                existingPlanCount: number;
                emptyDestinationDayCount: number;
                timeConflictCount: number;
                examCollisionCount: number;
                overCapacityDayCount: number;
                proposedMinutes: number;
            }[];
            summary: {
                targetCount: number;
                copiedPlanCount: number;
                existingPlanCount: number;
                emptyDestinationDayCount: number;
                timeConflictCount: number;
                examCollisionCount: number;
                overCapacityDayCount: number;
                proposedMinutes: number;
            };
        };
    }>;
    planHistory(user: AuthenticatedUser): Promise<{
        ok: boolean;
        data: {
            id: string;
            actorUserId: string | null;
            organizationId: string | null;
            createdAt: Date;
            metadata: Record<string, unknown>;
        }[];
    }>;
    shareResource(user: AuthenticatedUser, id: string, dto: ShareEducationDto): Promise<{
        ok: boolean;
        data: {
            resourceId: string;
            targetStudentId: string;
            shared: boolean;
            alreadyShared: boolean;
        };
    }>;
}
