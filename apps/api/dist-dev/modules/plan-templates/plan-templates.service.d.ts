import { Repository } from "typeorm";
import { Organization } from "../../database/entities/organization.entity";
import { Plan } from "../../database/entities/plan.entity";
import { PlanTemplate } from "../../database/entities/plan-template.entity";
import { Student } from "../../database/entities/student.entity";
import { AuthorizationService, UserContext } from "../authorization";
import { PlansService } from "../plans/plans.service";
import { ApplyPlanTemplateDto, PreviewPlanTemplateApplyDto } from "./plan-template.dto";
export declare class PlanTemplatesService {
    private templates;
    private organizations;
    private students;
    private plans;
    private authorization;
    private plansService?;
    constructor(templates: Repository<PlanTemplate>, organizations: Repository<Organization>, students: Repository<Student>, plans: Repository<Plan>, authorization: AuthorizationService, plansService?: PlansService | undefined);
    list(context: UserContext, organizationId: string, state?: string): Promise<PlanTemplate[]>;
    create(context: UserContext, input: {
        organizationId: string;
        title: string;
        description?: string;
        tags?: string[];
        days?: unknown[];
    }): Promise<PlanTemplate>;
    publish(context: UserContext, id: string): Promise<PlanTemplate>;
    previewApply(context: UserContext, id: string, input: PreviewPlanTemplateApplyDto): Promise<{
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
    }>;
    apply(context: UserContext, id: string, input: ApplyPlanTemplateDto): Promise<{
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
    }>;
}
