import { AuthenticatedUser } from "../auth";
import { AuthorizationService } from "../authorization";
import { ImportPlanDto } from "./dto/import-plan.dto";
import { PlansService } from "./plans.service";
export declare class StaffPlansController {
    private readonly plans;
    private readonly authorization;
    constructor(plans: PlansService, authorization: AuthorizationService);
    private context;
    private student;
    private plan;
    private task;
    list(user: AuthenticatedUser, studentId: string, from?: string, to?: string, date?: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            date: string;
            planDate: string;
            persianDate: string;
            dayLabel: string;
            jalaliId: string;
            motivationText: string;
            status: import("../../database/entities/plan.entity").PlanStatus;
            published: boolean;
            title: string;
            tasks: import("../../database/entities").Task[];
        }[];
    }>;
    create(user: AuthenticatedUser, dto: ImportPlanDto): Promise<{
        ok: boolean;
        data: {
            id: string;
            date: string;
            planDate: string;
            persianDate: string;
            dayLabel: string;
            jalaliId: string;
            motivationText: string;
            status: import("../../database/entities/plan.entity").PlanStatus;
            published: boolean;
            title: string;
            tasks: import("../../database/entities").Task[];
        };
    }>;
    update(user: AuthenticatedUser, id: string, body: Partial<ImportPlanDto>): Promise<{
        ok: boolean;
        data: {
            id: string;
            date: string;
            planDate: string;
            persianDate: string;
            dayLabel: string;
            jalaliId: string;
            motivationText: string;
            status: import("../../database/entities/plan.entity").PlanStatus;
            published: boolean;
            title: string;
            tasks: import("../../database/entities").Task[];
        };
    }>;
    remove(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            deleted: boolean;
        };
    }>;
    duplicate(user: AuthenticatedUser, id: string, date: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            date: string;
            planDate: string;
            persianDate: string;
            dayLabel: string;
            jalaliId: string;
            motivationText: string;
            status: import("../../database/entities/plan.entity").PlanStatus;
            published: boolean;
            title: string;
            tasks: import("../../database/entities").Task[];
        };
    }>;
    addTask(user: AuthenticatedUser, id: string, body: ImportPlanDto["tasks"][number]): Promise<{
        ok: boolean;
        data: {
            id: string;
            date: string;
            planDate: string;
            persianDate: string;
            dayLabel: string;
            jalaliId: string;
            motivationText: string;
            status: import("../../database/entities/plan.entity").PlanStatus;
            published: boolean;
            title: string;
            tasks: import("../../database/entities").Task[];
        };
    }>;
    updateTask(user: AuthenticatedUser, id: string, body: Partial<ImportPlanDto["tasks"][number]> & {
        planId?: string;
    }): Promise<{
        ok: boolean;
        data: {
            id: string;
            date: string;
            planDate: string;
            persianDate: string;
            dayLabel: string;
            jalaliId: string;
            motivationText: string;
            status: import("../../database/entities/plan.entity").PlanStatus;
            published: boolean;
            title: string;
            tasks: import("../../database/entities").Task[];
        };
    }>;
    removeTask(user: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: {
            id: string;
            date: string;
            planDate: string;
            persianDate: string;
            dayLabel: string;
            jalaliId: string;
            motivationText: string;
            status: import("../../database/entities/plan.entity").PlanStatus;
            published: boolean;
            title: string;
            tasks: import("../../database/entities").Task[];
        };
    }>;
    publish(user: AuthenticatedUser, body: {
        studentId: string;
        from: string;
        to: string;
        published?: boolean;
    }): Promise<{
        ok: boolean;
        data: {
            updated: number;
        };
    }>;
}
