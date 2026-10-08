import { Repository } from "typeorm";
import { LearningResource } from "../../database/entities/learning-resource.entity";
import { LearningResourceAssignment } from "../../database/entities/learning-resource-assignment.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Plan } from "../../database/entities/plan.entity";
import { Student } from "../../database/entities/student.entity";
import { Task } from "../../database/entities/task.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService } from "../authorization";
import { RealtimeService } from "../realtime/realtime.service";
import { SharePlanRangeDto } from "./education-sharing.dto";
export declare class EducationSharingService {
    private readonly students;
    private readonly memberships;
    private readonly plans;
    private readonly tasks;
    private readonly resources;
    private readonly assignments;
    private readonly auditLogs;
    private readonly authorization;
    private readonly realtime?;
    constructor(students: Repository<Student>, memberships: Repository<OrganizationMembership>, plans: Repository<Plan>, tasks: Repository<Task>, resources: Repository<LearningResource>, assignments: Repository<LearningResourceAssignment>, auditLogs: Repository<AuditLog>, authorization: AuthorizationService, realtime?: RealtimeService | undefined);
    peers(actor: AuthenticatedUser): Promise<{
        id: string;
        name: string;
        grade: string;
        organizationName: string;
    }[]>;
    sharePlan(actor: AuthenticatedUser, planId: string, targetStudentId: string, date?: string): Promise<Plan>;
    sharePlanRange(actor: AuthenticatedUser, planId: string, dto: SharePlanRangeDto): Promise<{
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
    }>;
    previewPlanRange(actor: AuthenticatedUser, planId: string, dto: SharePlanRangeDto): Promise<{
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
    }>;
    planHistory(actor: AuthenticatedUser): Promise<{
        id: string;
        actorUserId: string | null;
        organizationId: string | null;
        createdAt: Date;
        metadata: Record<string, unknown>;
    }[]>;
    shareResource(actor: AuthenticatedUser, resourceId: string, targetStudentId: string): Promise<{
        resourceId: string;
        targetStudentId: string;
        shared: boolean;
        alreadyShared: boolean;
    }>;
    private prepareRange;
    private auditOrganizationId;
    private requireStaffResourceScope;
    private copyPlan;
    private requireShareScope;
    private studentForActor;
    private shareOrganization;
    private activeOrganizationIds;
    private context;
}
