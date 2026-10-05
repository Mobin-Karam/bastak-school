import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { Organization } from "../../database/entities/organization.entity";
import { Plan } from "../../database/entities/plan.entity";
import { PlanTemplate } from "../../database/entities/plan-template.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { AuthorizationService, UserContext } from "../authorization";
import { PlansService } from "../plans/plans.service";
import {
  ApplyPlanTemplateDto,
  PreviewPlanTemplateApplyDto,
} from "./plan-template.dto";

@Injectable()
export class PlanTemplatesService {
  constructor(
    @InjectRepository(PlanTemplate) private templates: Repository<PlanTemplate>,
    @InjectRepository(Organization)
    private organizations: Repository<Organization>,
    @InjectRepository(Student) private students: Repository<Student>,
    @InjectRepository(Plan) private plans: Repository<Plan>,
    private authorization: AuthorizationService,
    private plansService?: PlansService,
  ) {}
  async list(context: UserContext, organizationId: string, state?: string) {
    if (
      !this.authorization.canAccessOrganization(
        context,
        organizationId,
        "plan_templates.read",
      )
    )
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "دسترسی به سازمان ندارید.",
      );
    const states = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"];
    if (state && !states.includes(state))
      throw new ApiException(
        400,
        "TEMPLATE_STATE_INVALID",
        "وضعیت الگو معتبر نیست.",
      );
    return this.templates.find({
      where: {
        organization: { id: organizationId },
        ...(state ? { state: state as any } : {}),
      },
      order: { updatedAt: "DESC" },
    });
  }
  async create(
    context: UserContext,
    input: {
      organizationId: string;
      title: string;
      description?: string;
      tags?: string[];
      days?: unknown[];
    },
  ) {
    if (
      !this.authorization.canAccessOrganization(
        context,
        input.organizationId,
        "plan_templates.manage",
      )
    )
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "دسترسی ساخت الگو ندارید.",
      );
    const title = String(input.title || "").trim();
    if (!title)
      throw new ApiException(
        400,
        "TEMPLATE_TITLE_REQUIRED",
        "عنوان الگو الزامی است.",
      );
    const organization = await this.organizations.findOneByOrFail({
      id: input.organizationId,
    });
    return this.templates.save(
      this.templates.create({
        organization,
        author: { id: context.id } as User,
        title: title.slice(0, 180),
        description: String(input.description || ""),
        tags: Array.isArray(input.tags)
          ? input.tags.map(String).slice(0, 30)
          : [],
        days: Array.isArray(input.days) ? input.days : [],
        state: "DRAFT",
        version: 1,
      }),
    );
  }
  async publish(context: UserContext, id: string) {
    const template = await this.templates.findOneOrFail({
      where: { id },
      relations: { organization: true },
    });
    if (
      !this.authorization.canAccessOrganization(
        context,
        template.organization.id,
        "plan_templates.publish",
      )
    )
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "دسترسی انتشار الگو ندارید.",
      );
    if (template.state === "ARCHIVED")
      throw new ApiException(
        409,
        "TEMPLATE_ARCHIVED",
        "الگوی بایگانی‌شده منتشر نمی‌شود.",
      );
    template.state = "PUBLISHED";
    return this.templates.save(template);
  }
  async previewApply(
    context: UserContext,
    id: string,
    input: PreviewPlanTemplateApplyDto,
  ) {
    const template = await this.templates.findOneOrFail({
      where: { id },
      relations: { organization: true },
    });
    if (
      !this.authorization.canAccessOrganization(
        context,
        template.organization.id,
        "plan_templates.read",
      )
    )
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "دسترسی به سازمان ندارید.",
      );
    if (template.state !== "PUBLISHED")
      throw new ApiException(
        409,
        "TEMPLATE_NOT_PUBLISHED",
        "فقط الگوی منتشرشده قابل اعمال است.",
      );
    const days = (Array.isArray(template.days) ? template.days : []).filter(
      (day): day is { offset: number; tasks?: unknown[] } =>
        Boolean(
          day &&
          typeof day === "object" &&
          Number.isInteger((day as { offset?: unknown }).offset) &&
          Number((day as { offset: number }).offset) >= 0,
        ),
    );
    if (!days.length)
      throw new ApiException(
        409,
        "TEMPLATE_EMPTY",
        "این الگو روز قابل اعمال ندارد.",
      );
    const ids = [...new Set(input.targetStudentIds)];
    if (!ids.length)
      throw new ApiException(
        400,
        "SHARE_TARGETS_REQUIRED",
        "حداقل یک دانش‌آموز مقصد انتخاب کنید.",
      );
    const recipients = await Promise.all(
      ids.map(async (studentId) => {
        if (
          !(await this.authorization.canAccessStudent(
            context,
            studentId,
            "plans.create",
          ))
        )
          throw new ApiException(
            403,
            "SHARE_SCOPE_FORBIDDEN",
            "دانش‌آموز خارج از محدوده دسترسی شما است.",
          );
        const student = await this.students.findOneByOrFail({ id: studentId });
        const dates = days.map((day) =>
          addDays(input.targetStartDate, day.offset),
        );
        const existing = await this.plans.find({
          where: dates.map((date) => ({ student: { id: studentId }, date })),
        });
        return {
          studentId,
          name: student.name,
          existingPlanCount: existing.length,
          emptyDestinationDayCount: dates.length - existing.length,
          days: dates.map((date, index) => ({
            date,
            existingPlan: existing.some((plan) => plan.date === date),
            proposedTaskCount: days[index].tasks?.length || 0,
          })),
        };
      }),
    );
    return {
      template: {
        id: template.id,
        version: template.version,
        dayCount: days.length,
      },
      targetStartDate: input.targetStartDate,
      recipients,
      summary: {
        targetCount: recipients.length,
        existingPlanCount: recipients.reduce(
          (sum, recipient) => sum + recipient.existingPlanCount,
          0,
        ),
        emptyDestinationDayCount: recipients.reduce(
          (sum, recipient) => sum + recipient.emptyDestinationDayCount,
          0,
        ),
      },
    };
  }
  async apply(context: UserContext, id: string, input: ApplyPlanTemplateDto) {
    if (!this.plansService)
      throw new ApiException(
        500,
        "PLAN_TEMPLATE_APPLY_UNAVAILABLE",
        "اعمال الگو در دسترس نیست.",
      );
    const preview = await this.previewApply(context, id, input);
    const template = await this.templates.findOneOrFail({
      where: { id },
      relations: { organization: true },
    });
    const days = templateDays(template);
    const targets = new Set(input.targetStudentIds);
    const created: Array<{ studentId: string; planId: string; date: string }> =
      [];
    const skipped: Array<{
      studentId: string;
      date: string;
      reason: "EXISTING_PLAN";
    }> = [];

    for (const recipient of preview.recipients) {
      if (!targets.has(recipient.studentId)) continue;
      const existing = await this.plans.find({
        where: days.map((day) => ({
          student: { id: recipient.studentId },
          date: addDays(input.targetStartDate, day.offset),
        })),
      });
      const existingDates = new Set(existing.map((plan) => plan.date));
      for (const day of days) {
        const date = addDays(input.targetStartDate, day.offset);
        if (existingDates.has(date) && !input.replaceExisting) {
          skipped.push({
            studentId: recipient.studentId,
            date,
            reason: "EXISTING_PLAN",
          });
          continue;
        }
        const plan = await this.plansService.upsertPlan({
          studentId: recipient.studentId,
          date,
          publish: true,
          title: day.title,
          motivationText: day.motivationText,
          tasks: day.tasks,
          templateId: template.id,
          templateVersion: template.version,
        });
        created.push({ studentId: recipient.studentId, planId: plan.id, date });
      }
    }
    return {
      template: { id: template.id, version: template.version },
      created,
      skipped,
    };
  }
}

type TemplateDay = {
  offset: number;
  title: string;
  motivationText: string;
  tasks: any[];
};
function templateDays(template: PlanTemplate): TemplateDay[] {
  return (Array.isArray(template.days) ? template.days : [])
    .filter((day): day is Record<string, unknown> =>
      Boolean(
        day &&
        typeof day === "object" &&
        Number.isInteger((day as { offset?: unknown }).offset) &&
        Number((day as { offset: number }).offset) >= 0,
      ),
    )
    .map((day) => ({
      offset: Number(day.offset),
      title: String(day.title || "برنامه روزانه"),
      motivationText: String(day.motivationText || ""),
      tasks: Array.isArray(day.tasks) ? (day.tasks as any[]) : [],
    }));
}

function addDays(date: string, offset: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}
