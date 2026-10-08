import { Organization } from "./organization.entity";
import { User } from "./user.entity";
export type PlanTemplateState = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
export declare class PlanTemplate {
    id: string;
    organization: Organization;
    author?: User | null;
    title: string;
    description: string;
    state: PlanTemplateState;
    version: number;
    tags: string[];
    days: unknown[];
    createdAt: Date;
    updatedAt: Date;
}
