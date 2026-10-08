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
exports.EducationSharingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const learning_resource_entity_1 = require("../../database/entities/learning-resource.entity");
const learning_resource_assignment_entity_1 = require("../../database/entities/learning-resource-assignment.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const plan_entity_1 = require("../../database/entities/plan.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const task_entity_1 = require("../../database/entities/task.entity");
const organization_membership_entity_2 = require("../../database/entities/organization-membership.entity");
const authorization_1 = require("../authorization");
const realtime_service_1 = require("../realtime/realtime.service");
let EducationSharingService = class EducationSharingService {
    students;
    memberships;
    plans;
    tasks;
    resources;
    assignments;
    auditLogs;
    authorization;
    realtime;
    constructor(students, memberships, plans, tasks, resources, assignments, auditLogs, authorization, realtime) {
        this.students = students;
        this.memberships = memberships;
        this.plans = plans;
        this.tasks = tasks;
        this.resources = resources;
        this.assignments = assignments;
        this.auditLogs = auditLogs;
        this.authorization = authorization;
        this.realtime = realtime;
    }
    async peers(actor) {
        const source = await this.studentForActor(actor);
        const organizationIds = await this.activeOrganizationIds(source.user.id);
        if (!organizationIds.length)
            return [];
        const rows = await this.memberships.find({
            where: {
                organization: { id: (0, typeorm_2.In)(organizationIds) },
                status: organization_membership_entity_2.MembershipStatus.ACTIVE,
            },
            relations: { user: { student: true }, organization: true },
        });
        const unique = new Map();
        for (const row of rows) {
            const student = row.user.student;
            if (!student ||
                student.id === source.id ||
                student.accountStatus !== "active")
                continue;
            unique.set(student.id, {
                id: student.id,
                name: student.name,
                grade: student.grade,
                organizationName: row.organization.name,
            });
        }
        return [...unique.values()].sort((left, right) => left.name.localeCompare(right.name, "fa"));
    }
    async sharePlan(actor, planId, targetStudentId, date) {
        const source = await this.plans.findOne({
            where: { id: planId },
            relations: { student: { user: true }, tasks: true },
        });
        if (!source)
            throw new api_exception_1.ApiException(404, "PLAN_NOT_FOUND", "برنامه پیدا نشد.");
        const target = await this.requireShareScope(actor, source.student, targetStudentId, "plans.create");
        const targetDate = date || source.date;
        let copy = await this.plans.findOne({
            where: { student: { id: target.id }, date: targetDate },
            relations: { tasks: true },
        });
        if (copy)
            await this.tasks.delete({ plan: { id: copy.id } });
        else
            copy = await this.plans.save(this.plans.create({
                student: target,
                date: targetDate,
                status: source.status,
            }));
        Object.assign(copy, planCopyValues(source));
        await this.plans.save(copy);
        copy.tasks = source.tasks.map((task) => this.tasks.create({
            plan: copy,
            type: task.type,
            title: task.title,
            subject: task.subject,
            description: task.description,
            startTime: task.startTime,
            endTime: task.endTime,
            duration: task.duration,
            testCount: task.testCount,
            note: task.note,
            priority: task.priority,
            pages: task.pages,
            examRef: task.examRef,
            examId: task.examId,
            conflict: task.conflict,
            conflictGroup: task.conflictGroup,
            status: "PLANNED",
            completedAt: null,
        }));
        await this.tasks.save(copy.tasks);
        return this.plans.findOneOrFail({
            where: { id: copy.id },
            relations: { tasks: true, student: true },
        });
    }
    async sharePlanRange(actor, planId, dto) {
        const anchor = await this.plans.findOne({
            where: { id: planId },
            relations: { student: { user: true } },
        });
        if (!anchor)
            throw new api_exception_1.ApiException(404, "PLAN_NOT_FOUND", "برنامه پیدا نشد.");
        const prepared = await this.prepareRange(actor, anchor, dto);
        const { from, targetStartDate, conflictPolicy, sourcePlans, targets } = prepared;
        const result = await this.plans.manager.transaction(async (manager) => {
            let copied = 0;
            let skipped = 0;
            for (const target of targets) {
                for (const source of sourcePlans) {
                    const destinationDate = addDays(targetStartDate, daysBetween(from, source.date));
                    const outcome = await this.copyPlan(manager, source, target, destinationDate, conflictPolicy);
                    copied += outcome === "copied" ? 1 : 0;
                    skipped += outcome === "skipped" ? 1 : 0;
                }
            }
            await manager.getRepository(audit_log_entity_1.AuditLog).save(manager.getRepository(audit_log_entity_1.AuditLog).create({
                user: { id: actor.id },
                organizationId: this.auditOrganizationId(actor),
                action: "education.plan_range_shared",
                entity: "plan_range",
                metadata: {
                    sourceStudentId: anchor.student.id,
                    sourceFrom: from,
                    sourceTo: prepared.to,
                    targetStartDate,
                    targetStudentIds: targets.map((target) => target.id),
                    conflictPolicy,
                    copied,
                    skipped,
                },
            }));
            return { copied, skipped };
        });
        return {
            source: { from, to: prepared.to, planCount: sourcePlans.length },
            targetStartDate,
            targetCount: targets.length,
            conflictPolicy,
            ...result,
        };
    }
    async previewPlanRange(actor, planId, dto) {
        const anchor = await this.plans.findOne({
            where: { id: planId },
            relations: { student: { user: true } },
        });
        if (!anchor)
            throw new api_exception_1.ApiException(404, "PLAN_NOT_FOUND", "برنامه پیدا نشد.");
        const prepared = await this.prepareRange(actor, anchor, dto);
        const targetIds = prepared.targets.map((target) => target.id);
        const dates = prepared.sourcePlans.flatMap((source) => targetIds.map((studentId) => ({
            studentId,
            date: addDays(prepared.targetStartDate, daysBetween(prepared.from, source.date)),
            source,
        })));
        const existing = dates.length
            ? await this.plans.find({
                where: dates.map(({ studentId, date }) => ({
                    student: { id: studentId },
                    date,
                })),
                relations: { student: true, tasks: true },
            })
            : [];
        const existingByTargetDate = new Map(existing.map((plan) => [`${plan.student.id}:${plan.date}`, plan]));
        const recipients = prepared.targets.map((target) => {
            const days = prepared.sourcePlans.map((source) => {
                const date = addDays(prepared.targetStartDate, daysBetween(prepared.from, source.date));
                const destination = existingByTargetDate.get(`${target.id}:${date}`);
                const conflicts = destination
                    ? source.tasks.reduce((count, task) => count +
                        destination.tasks.filter((candidate) => overlaps(task.startTime, task.endTime, candidate.startTime, candidate.endTime)).length, 0)
                    : 0;
                const examCollisions = destination
                    ? source.tasks.reduce((count, task) => count +
                        destination.tasks.filter((candidate) => isExamTask(task) &&
                            isExamTask(candidate) &&
                            overlaps(task.startTime, task.endTime, candidate.startTime, candidate.endTime)).length, 0)
                    : 0;
                const plannedMinutes = source.tasks.reduce((sum, task) => sum + taskMinutes(task.duration, task.startTime, task.endTime), 0);
                const capacityMinutes = dailyCapacityMinutes(target.dailyCapacity);
                return {
                    date,
                    sourceTaskCount: source.tasks.length,
                    existingPlan: Boolean(destination),
                    existingTaskCount: destination?.tasks.length || 0,
                    timeConflicts: conflicts,
                    examCollisions,
                    plannedMinutes,
                    overCapacity: plannedMinutes > capacityMinutes,
                };
            });
            return {
                studentId: target.id,
                name: target.name,
                days,
                existingPlanCount: days.filter((day) => day.existingPlan).length,
                emptyDestinationDayCount: days.filter((day) => !day.existingPlan)
                    .length,
                timeConflictCount: days.reduce((sum, day) => sum + day.timeConflicts, 0),
                examCollisionCount: days.reduce((sum, day) => sum + day.examCollisions, 0),
                overCapacityDayCount: days.filter((day) => day.overCapacity).length,
                proposedMinutes: days.reduce((sum, day) => sum + day.plannedMinutes, 0),
            };
        });
        return {
            source: {
                from: prepared.from,
                to: prepared.to,
                planCount: prepared.sourcePlans.length,
            },
            targetStartDate: prepared.targetStartDate,
            conflictPolicy: prepared.conflictPolicy,
            recipients,
            summary: {
                targetCount: recipients.length,
                copiedPlanCount: recipients.length * prepared.sourcePlans.length,
                existingPlanCount: recipients.reduce((sum, recipient) => sum + recipient.existingPlanCount, 0),
                emptyDestinationDayCount: recipients.reduce((sum, recipient) => sum + recipient.emptyDestinationDayCount, 0),
                timeConflictCount: recipients.reduce((sum, recipient) => sum + recipient.timeConflictCount, 0),
                examCollisionCount: recipients.reduce((sum, recipient) => sum + recipient.examCollisionCount, 0),
                overCapacityDayCount: recipients.reduce((sum, recipient) => sum + recipient.overCapacityDayCount, 0),
                proposedMinutes: recipients.reduce((sum, recipient) => sum + recipient.proposedMinutes, 0),
            },
        };
    }
    async planHistory(actor) {
        const context = this.context(actor);
        const where = context.roles.includes("PLATFORM_ADMIN")
            ? { action: "education.plan_range_shared" }
            : context.roles.includes("ORGANIZATION_ADMIN") &&
                context.organizationIds.length === 1
                ? {
                    action: "education.plan_range_shared",
                    organizationId: context.organizationIds[0],
                }
                : { action: "education.plan_range_shared", user: { id: actor.id } };
        const rows = await this.auditLogs.find({
            where,
            relations: { user: true },
            order: { createdAt: "DESC" },
            take: 100,
        });
        return rows.map((row) => ({
            id: row.id,
            actorUserId: row.user?.id || null,
            organizationId: row.organizationId || null,
            createdAt: row.createdAt,
            metadata: row.metadata || {},
        }));
    }
    async shareResource(actor, resourceId, targetStudentId) {
        const resource = await this.resources.findOne({
            where: { id: resourceId, status: "PUBLISHED" },
            relations: { assignments: { student: { user: true } }, createdBy: true },
        });
        if (!resource)
            throw new api_exception_1.ApiException(404, "LEARNING_RESOURCE_NOT_FOUND", "محتوای آموزشی پیدا نشد.");
        const roles = actor.roles || [actor.role];
        const actorStudent = await this.students.findOne({
            where: { user: { id: actor.id } },
            relations: { user: true },
        });
        let target;
        if (roles.includes("STUDENT")) {
            const source = actorStudent
                ? resource.assignments.find((item) => item.student.id === actorStudent.id)?.student
                : undefined;
            if (!source)
                throw new api_exception_1.ApiException(403, "RESOURCE_SHARE_FORBIDDEN", "این محتوا برای اشتراک‌گذاری در دسترس شما نیست.");
            target = await this.requireShareScope(actor, source, targetStudentId, "learning_resources.manage");
        }
        else {
            target = await this.requireStaffResourceScope(actor, resource, targetStudentId);
        }
        const existing = await this.assignments.findOne({
            where: { resource: { id: resource.id }, student: { id: target.id } },
        });
        if (!existing)
            await this.assignments.save(this.assignments.create({ resource, student: target }));
        if (!existing && target.user?.id)
            this.realtime?.emitToUser(target.user.id, "learning-resource.updated", {
                resourceId: resource.id,
                action: "assigned",
            });
        return {
            resourceId: resource.id,
            targetStudentId: target.id,
            shared: !existing,
            alreadyShared: !!existing,
        };
    }
    async prepareRange(actor, anchor, dto) {
        const from = dto.sourceFrom || anchor.date;
        const to = dto.sourceTo || anchor.date;
        if (from > to)
            throw new api_exception_1.ApiException(400, "SHARE_RANGE_INVALID", "ابتدای بازه باید پیش از انتهای بازه باشد.");
        if (daysBetween(from, to) > 366)
            throw new api_exception_1.ApiException(400, "SHARE_RANGE_TOO_LARGE", "بازه اشتراک‌گذاری حداکثر یک سال است.");
        const targetStartDate = dto.targetStartDate || from;
        const conflictPolicy = dto.conflictPolicy || "skip";
        const sourcePlans = await this.plans.find({
            where: { student: { id: anchor.student.id }, date: (0, typeorm_2.Between)(from, to) },
            relations: { student: { user: true }, tasks: true },
            order: { date: "ASC" },
        });
        if (!sourcePlans.length)
            throw new api_exception_1.ApiException(404, "PLAN_RANGE_EMPTY", "برنامه‌ای در بازه انتخاب‌شده پیدا نشد.");
        const targetIds = [...new Set(dto.targetStudentIds || [])];
        if (!targetIds.length)
            throw new api_exception_1.ApiException(400, "SHARE_TARGETS_REQUIRED", "حداقل یک دانش‌آموز مقصد انتخاب کنید.");
        const targets = await Promise.all(targetIds.map((targetId) => this.requireShareScope(actor, anchor.student, targetId, "plans.create")));
        return { from, to, targetStartDate, conflictPolicy, sourcePlans, targets };
    }
    auditOrganizationId(actor) {
        const organizationIds = this.context(actor).organizationIds;
        return organizationIds.length === 1 ? organizationIds[0] : null;
    }
    async requireStaffResourceScope(actor, resource, targetStudentId) {
        const target = await this.students.findOne({
            where: { id: targetStudentId },
            relations: { user: true },
        });
        if (!target || target.accountStatus !== "active")
            throw new api_exception_1.ApiException(404, "SHARE_TARGET_NOT_FOUND", "دانش‌آموز گیرنده پیدا نشد.");
        const context = this.context(actor);
        const platform = context.roles.includes("PLATFORM_ADMIN");
        const managesTarget = await this.authorization.canAccessStudent(context, target.id, "learning_resources.manage");
        const managesSources = resource.assignments.length > 0 &&
            (await Promise.all(resource.assignments.map((item) => this.authorization.canAccessStudent(context, item.student.id, "learning_resources.manage")))).every(Boolean);
        if (!managesTarget ||
            (!platform && resource.createdBy.id !== actor.id && !managesSources))
            throw new api_exception_1.ApiException(403, "SHARE_SCOPE_FORBIDDEN", "این محتوا یا دانش‌آموز خارج از محدوده دسترسی شما است.");
        return target;
    }
    async copyPlan(manager, source, target, date, conflictPolicy) {
        const plans = manager.getRepository(plan_entity_1.Plan);
        const tasks = manager.getRepository(task_entity_1.Task);
        let copy = await plans.findOne({
            where: { student: { id: target.id }, date },
            relations: { tasks: true },
        });
        if (copy && conflictPolicy === "skip")
            return "skipped";
        if (copy)
            await tasks.delete({ plan: { id: copy.id } });
        else
            copy = await plans.save(plans.create({ student: target, date, status: source.status }));
        Object.assign(copy, planCopyValues(source));
        await plans.save(copy);
        copy.tasks = source.tasks.map((task) => tasks.create({
            plan: copy,
            type: task.type,
            title: task.title,
            subject: task.subject,
            description: task.description,
            startTime: task.startTime,
            endTime: task.endTime,
            duration: task.duration,
            testCount: task.testCount,
            note: task.note,
            priority: task.priority,
            status: "PLANNED",
            completedAt: null,
            actualMinutes: 0,
            actualTests: 0,
            completionDifficulty: "",
            completionNote: "",
            pages: task.pages,
            examRef: task.examRef,
            examId: task.examId,
            conflict: task.conflict,
            conflictGroup: task.conflictGroup,
        }));
        await tasks.save(copy.tasks);
        return "copied";
    }
    async requireShareScope(actor, source, targetStudentId, staffCapability) {
        if (source.id === targetStudentId)
            throw new api_exception_1.ApiException(400, "SHARE_TARGET_SAME_STUDENT", "گیرنده باید دانش‌آموز دیگری باشد.");
        const target = await this.students.findOne({
            where: { id: targetStudentId },
            relations: { user: true },
        });
        if (!target || target.accountStatus !== "active")
            throw new api_exception_1.ApiException(404, "SHARE_TARGET_NOT_FOUND", "دانش‌آموز گیرنده پیدا نشد.");
        const roles = actor.roles || [actor.role];
        if (roles.includes("STUDENT")) {
            if (source.user?.id !== actor.id ||
                !(await this.shareOrganization(source, target)))
                throw new api_exception_1.ApiException(403, "SHARE_SCOPE_FORBIDDEN", "اشتراک‌گذاری فقط با دانش‌آموزان سازمان مشترک مجاز است.");
            return target;
        }
        const context = this.context(actor);
        if (!(await this.authorization.canAccessStudent(context, source.id, staffCapability)) ||
            !(await this.authorization.canAccessStudent(context, target.id, staffCapability)))
            throw new api_exception_1.ApiException(403, "SHARE_SCOPE_FORBIDDEN", "یک یا چند دانش‌آموز خارج از محدوده دسترسی شما هستند.");
        return target;
    }
    async studentForActor(actor) {
        const student = await this.students.findOne({
            where: { user: { id: actor.id } },
            relations: { user: true },
        });
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        return student;
    }
    async shareOrganization(left, right) {
        if (!left.user || !right.user)
            return false;
        const [leftIds, rightIds] = await Promise.all([
            this.activeOrganizationIds(left.user.id),
            this.activeOrganizationIds(right.user.id),
        ]);
        return leftIds.some((id) => rightIds.includes(id));
    }
    async activeOrganizationIds(userId) {
        const rows = await this.memberships.find({
            where: { user: { id: userId }, status: organization_membership_entity_2.MembershipStatus.ACTIVE },
            relations: { organization: true },
        });
        return rows.map((row) => row.organization.id);
    }
    context(actor) {
        return {
            ...actor,
            roles: actor.roles || [actor.role],
            capabilities: actor.capabilities || [],
            membershipIds: actor.membershipIds || [],
            organizationIds: actor.organizationIds || [],
        };
    }
};
exports.EducationSharingService = EducationSharingService;
exports.EducationSharingService = EducationSharingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(2, (0, typeorm_1.InjectRepository)(plan_entity_1.Plan)),
    __param(3, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(4, (0, typeorm_1.InjectRepository)(learning_resource_entity_1.LearningResource)),
    __param(5, (0, typeorm_1.InjectRepository)(learning_resource_assignment_entity_1.LearningResourceAssignment)),
    __param(6, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService,
        realtime_service_1.RealtimeService])
], EducationSharingService);
function planCopyValues(source) {
    return {
        status: source.status,
        title: source.title,
        dayLabel: source.dayLabel,
        persianDate: source.persianDate,
        jalaliId: source.jalaliId,
        motivationText: source.motivationText,
    };
}
function daysBetween(from, to) {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
        86400000);
}
function addDays(date, offset) {
    const value = new Date(`${date}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + offset);
    return value.toISOString().slice(0, 10);
}
function overlaps(firstStart, firstEnd, secondStart, secondEnd) {
    if (!firstStart || !firstEnd || !secondStart || !secondEnd)
        return false;
    return firstStart < secondEnd && secondStart < firstEnd;
}
function taskMinutes(duration, start, end) {
    if (Number.isFinite(duration) && duration > 0)
        return duration;
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end))
        return 0;
    const toMinutes = (value) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
    return Math.max(0, toMinutes(end) - toMinutes(start));
}
function dailyCapacityMinutes(value) {
    const numeric = Number(String(value || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric * 60 : 600;
}
function isExamTask(task) {
    return task.type === "EXAM" || Boolean(task.examId || task.examRef);
}
//# sourceMappingURL=education-sharing.service.js.map