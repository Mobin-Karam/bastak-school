"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanTemplatesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_entity_1 = require("../../database/entities/organization.entity");
const plan_entity_1 = require("../../database/entities/plan.entity");
const plan_template_entity_1 = require("../../database/entities/plan-template.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const authorization_1 = require("../authorization");
const plans_service_1 = require("../plans/plans.service");
let PlanTemplatesService = class PlanTemplatesService {
    templates;
    organizations;
    students;
    plans;
    authorization;
    plansService;
    constructor(templates, organizations, students, plans, authorization, plansService) {
        this.templates = templates;
        this.organizations = organizations;
        this.students = students;
        this.plans = plans;
        this.authorization = authorization;
        this.plansService = plansService;
    }
    async list(context, organizationId, state) {
        if (!this.authorization.canAccessOrganization(context, organizationId, "plan_templates.read"))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "دسترسی به سازمان ندارید.");
        const states = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"];
        if (state && !states.includes(state))
            throw new api_exception_1.ApiException(400, "TEMPLATE_STATE_INVALID", "وضعیت الگو معتبر نیست.");
        return this.templates.find({
            where: {
                organization: { id: organizationId },
                ...(state ? { state: state } : {}),
            },
            order: { updatedAt: "DESC" },
        });
    }
    async create(context, input) {
        if (!this.authorization.canAccessOrganization(context, input.organizationId, "plan_templates.manage"))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "دسترسی ساخت الگو ندارید.");
        const title = String(input.title || "").trim();
        if (!title)
            throw new api_exception_1.ApiException(400, "TEMPLATE_TITLE_REQUIRED", "عنوان الگو الزامی است.");
        const organization = await this.organizations.findOneByOrFail({
            id: input.organizationId,
        });
        return this.templates.save(this.templates.create({
            organization,
            author: { id: context.id },
            title: title.slice(0, 180),
            description: String(input.description || ""),
            tags: Array.isArray(input.tags)
                ? input.tags.map(String).slice(0, 30)
                : [],
            days: Array.isArray(input.days) ? input.days : [],
            state: "DRAFT",
            version: 1,
        }));
    }
    async publish(context, id) {
        const template = await this.templates.findOneOrFail({
            where: { id },
            relations: { organization: true },
        });
        if (!this.authorization.canAccessOrganization(context, template.organization.id, "plan_templates.publish"))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "دسترسی انتشار الگو ندارید.");
        if (template.state === "ARCHIVED")
            throw new api_exception_1.ApiException(409, "TEMPLATE_ARCHIVED", "الگوی بایگانی‌شده منتشر نمی‌شود.");
        template.state = "PUBLISHED";
        return this.templates.save(template);
    }
    async previewApply(context, id, input) {
        const template = await this.templates.findOneOrFail({
            where: { id },
            relations: { organization: true },
        });
        if (!this.authorization.canAccessOrganization(context, template.organization.id, "plan_templates.read"))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "دسترسی به سازمان ندارید.");
        if (template.state !== "PUBLISHED")
            throw new api_exception_1.ApiException(409, "TEMPLATE_NOT_PUBLISHED", "فقط الگوی منتشرشده قابل اعمال است.");
        const days = (Array.isArray(template.days) ? template.days : []).filter((day) => Boolean(day &&
            typeof day === "object" &&
            Number.isInteger(day.offset) &&
            Number(day.offset) >= 0));
        if (!days.length)
            throw new api_exception_1.ApiException(409, "TEMPLATE_EMPTY", "این الگو روز قابل اعمال ندارد.");
        const ids = [...new Set(input.targetStudentIds)];
        if (!ids.length)
            throw new api_exception_1.ApiException(400, "SHARE_TARGETS_REQUIRED", "حداقل یک دانش‌آموز مقصد انتخاب کنید.");
        const recipients = await Promise.all(ids.map(async (studentId) => {
            if (!(await this.authorization.canAccessStudent(context, studentId, "plans.create")))
                throw new api_exception_1.ApiException(403, "SHARE_SCOPE_FORBIDDEN", "دانش‌آموز خارج از محدوده دسترسی شما است.");
            const student = await this.students.findOneByOrFail({ id: studentId });
            const dates = days.map((day) => addDays(input.targetStartDate, day.offset));
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
        }));
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
                existingPlanCount: recipients.reduce((sum, recipient) => sum + recipient.existingPlanCount, 0),
                emptyDestinationDayCount: recipients.reduce((sum, recipient) => sum + recipient.emptyDestinationDayCount, 0),
            },
        };
    }
    async apply(context, id, input) {
        if (!this.plansService)
            throw new api_exception_1.ApiException(500, "PLAN_TEMPLATE_APPLY_UNAVAILABLE", "اعمال الگو در دسترس نیست.");
        const preview = await this.previewApply(context, id, input);
        const template = await this.templates.findOneOrFail({
            where: { id },
            relations: { organization: true },
        });
        const days = templateDays(template);
        const targets = new Set(input.targetStudentIds);
        const created = [];
        const skipped = [];
        for (const recipient of preview.recipients) {
            if (!targets.has(recipient.studentId))
                continue;
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
};
exports.PlanTemplatesService = PlanTemplatesService;
exports.PlanTemplatesService = PlanTemplatesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(plan_template_entity_1.PlanTemplate)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService,
        plans_service_1.PlansService])
], PlanTemplatesService);
function templateDays(template) {
    return (Array.isArray(template.days) ? template.days : [])
        .filter((day) => Boolean(day &&
        typeof day === "object" &&
        Number.isInteger(day.offset) &&
        Number(day.offset) >= 0))
        .map((day) => ({
        offset: Number(day.offset),
        title: String(day.title || "برنامه روزانه"),
        motivationText: String(day.motivationText || ""),
        tasks: Array.isArray(day.tasks) ? day.tasks : [],
    }));
}
function addDays(date, offset) {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + offset);
    return value.toISOString().slice(0, 10);
}
//# sourceMappingURL=plan-templates.service.js.map