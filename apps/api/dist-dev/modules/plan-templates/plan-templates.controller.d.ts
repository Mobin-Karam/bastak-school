import { AuthenticatedUser } from "../auth";
import { PlanTemplatesService } from "./plan-templates.service";
import { ApplyPlanTemplateDto, CreatePlanTemplateDto, PreviewPlanTemplateApplyDto } from "./plan-template.dto";
export declare class PlanTemplatesController {
    private service;
    constructor(service: PlanTemplatesService);
    list(u: AuthenticatedUser, id: string, state?: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").PlanTemplate[];
    }>;
    create(u: AuthenticatedUser, body: CreatePlanTemplateDto): Promise<{
        ok: boolean;
        data: import("../../database/entities").PlanTemplate;
    }>;
    publish(u: AuthenticatedUser, id: string): Promise<{
        ok: boolean;
        data: import("../../database/entities").PlanTemplate;
    }>;
    preview(u: AuthenticatedUser, id: string, body: PreviewPlanTemplateApplyDto): Promise<{
        ok: boolean;
        data: {
            template: {
                id: string;
                version: number;
                dayCount: number;
            };
            targetStartDate: string;
            recipients: {
                studentId: string;
                name: string;
                existingPlanCount: number;
                emptyDestinationDayCount: number;
                days: {
                    date: string;
                    existingPlan: boolean;
                    proposedTaskCount: number;
                }[];
            }[];
            summary: {
                targetCount: number;
                existingPlanCount: number;
                emptyDestinationDayCount: number;
            };
        };
    }>;
    apply(u: AuthenticatedUser, id: string, body: ApplyPlanTemplateDto): Promise<{
        ok: boolean;
        data: {
            template: {
                id: string;
                version: number;
            };
            created: {
                studentId: string;
                planId: string;
                date: string;
            }[];
            skipped: {
                studentId: string;
                date: string;
                reason: "EXISTING_PLAN";
            }[];
        };
    }>;
}
