import { Repository } from "typeorm";
import { Plan, PlanStatus } from "../../database/entities/plan.entity";
import { Student } from "../../database/entities/student.entity";
import { Task } from "../../database/entities/task.entity";
import { ImportPlanDto } from "./dto/import-plan.dto";
export declare class PlansService {
    private readonly plans;
    private readonly students;
    private readonly tasks;
    constructor(plans: Repository<Plan>, students: Repository<Student>, tasks: Repository<Task>);
    list(studentId: string, from: string, to: string): Promise<{
        id: string;
        date: string;
        planDate: string;
        persianDate: string;
        dayLabel: string;
        jalaliId: string;
        motivationText: string;
        status: PlanStatus;
        published: boolean;
        title: string;
        tasks: Task[];
    }[]>;
    studentIdForPlan(id: string): Promise<string>;
    studentIdForTask(id: string): Promise<string>;
    previewImport(dto: ImportPlanDto): Promise<{
        valid: boolean;
        plan: ImportPlanDto;
        warnings: string[];
        summary: {
            taskCount: number;
            date: string | undefined;
        };
    }>;
    importPlan(dto: ImportPlanDto): Promise<{
        id: string;
        date: string;
        planDate: string;
        persianDate: string;
        dayLabel: string;
        jalaliId: string;
        motivationText: string;
        status: PlanStatus;
        published: boolean;
        title: string;
        tasks: Task[];
    }>;
    upsertPlan(dto: ImportPlanDto): Promise<{
        id: string;
        date: string;
        planDate: string;
        persianDate: string;
        dayLabel: string;
        jalaliId: string;
        motivationText: string;
        status: PlanStatus;
        published: boolean;
        title: string;
        tasks: Task[];
    }>;
    updatePlan(id: string, body: Partial<ImportPlanDto>): Promise<{
        id: string;
        date: string;
        planDate: string;
        persianDate: string;
        dayLabel: string;
        jalaliId: string;
        motivationText: string;
        status: PlanStatus;
        published: boolean;
        title: string;
        tasks: Task[];
    }>;
    deletePlan(id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    duplicatePlan(id: string, planDate: string): Promise<{
        id: string;
        date: string;
        planDate: string;
        persianDate: string;
        dayLabel: string;
        jalaliId: string;
        motivationText: string;
        status: PlanStatus;
        published: boolean;
        title: string;
        tasks: Task[];
    }>;
    addTask(planId: string, body: ImportPlanDto["tasks"][number]): Promise<{
        id: string;
        date: string;
        planDate: string;
        persianDate: string;
        dayLabel: string;
        jalaliId: string;
        motivationText: string;
        status: PlanStatus;
        published: boolean;
        title: string;
        tasks: Task[];
    }>;
    updateTask(id: string, body: Partial<ImportPlanDto["tasks"][number]> & {
        planId?: string;
    }): Promise<{
        id: string;
        date: string;
        planDate: string;
        persianDate: string;
        dayLabel: string;
        jalaliId: string;
        motivationText: string;
        status: PlanStatus;
        published: boolean;
        title: string;
        tasks: Task[];
    }>;
    deleteTask(id: string): Promise<{
        id: string;
        date: string;
        planDate: string;
        persianDate: string;
        dayLabel: string;
        jalaliId: string;
        motivationText: string;
        status: PlanStatus;
        published: boolean;
        title: string;
        tasks: Task[];
    }>;
    publishRange(studentId: string, from: string, to: string, published: boolean): Promise<{
        updated: number;
    }>;
    importPayload(body: {
        studentId: string;
        data?: unknown;
        publishImported?: boolean;
    }): Promise<{
        importedPlans: number;
        plans: {
            id: string;
            date: string;
            planDate: string;
            persianDate: string;
            dayLabel: string;
            jalaliId: string;
            motivationText: string;
            status: PlanStatus;
            published: boolean;
            title: string;
            tasks: Task[];
        }[];
    }>;
    previewPayload(body: {
        studentId: string;
        data?: unknown;
    }): {
        valid: boolean;
        errors: never[];
        warnings: string[];
        summary: {
            planCount: number;
            taskCount: number;
        };
        normalized: {
            plans: ImportPlanDto[];
        };
    };
    private createTasks;
    private taskValues;
    private assertTaskTimeRange;
    private planValues;
    private findPresentedPlan;
    private presentPlan;
}
