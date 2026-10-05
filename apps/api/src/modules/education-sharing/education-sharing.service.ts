import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, EntityManager, In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { LearningResource } from "../../database/entities/learning-resource.entity";
import { LearningResourceAssignment } from "../../database/entities/learning-resource-assignment.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Plan } from "../../database/entities/plan.entity";
import { Student } from "../../database/entities/student.entity";
import { Task } from "../../database/entities/task.entity";
import { MembershipStatus } from "../../database/entities/organization-membership.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService, UserContext } from "../authorization";
import { RealtimeService } from "../realtime/realtime.service";
import { SharePlanRangeDto } from "./education-sharing.dto";

@Injectable()
export class EducationSharingService {
  constructor(
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    @InjectRepository(Plan) private readonly plans: Repository<Plan>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    @InjectRepository(LearningResource)
    private readonly resources: Repository<LearningResource>,
    @InjectRepository(LearningResourceAssignment)
    private readonly assignments: Repository<LearningResourceAssignment>,
    @InjectRepository(AuditLog)
    private readonly auditLogs: Repository<AuditLog>,
    private readonly authorization: AuthorizationService,
    private readonly realtime?: RealtimeService,
  ) {}

  async peers(actor: AuthenticatedUser) {
    const source = await this.studentForActor(actor);
    const organizationIds = await this.activeOrganizationIds(source.user!.id);
    if (!organizationIds.length) return [];
    const rows = await this.memberships.find({
      where: {
        organization: { id: In(organizationIds) },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: { student: true }, organization: true },
    });
    const unique = new Map<
      string,
      { id: string; name: string; grade: string; organizationName: string }
    >();
    for (const row of rows) {
      const student = row.user.student;
      if (
        !student ||
        student.id === source.id ||
        student.accountStatus !== "active"
      )
        continue;
      unique.set(student.id, {
        id: student.id,
        name: student.name,
        grade: student.grade,
        organizationName: row.organization.name,
      });
    }
    return [...unique.values()].sort((left, right) =>
      left.name.localeCompare(right.name, "fa"),
    );
  }

  async sharePlan(
    actor: AuthenticatedUser,
    planId: string,
    targetStudentId: string,
    date?: string,
  ) {
    const source = await this.plans.findOne({
      where: { id: planId },
      relations: { student: { user: true }, tasks: true },
    });
    if (!source)
      throw new ApiException(404, "PLAN_NOT_FOUND", "برنامه پیدا نشد.");
    const target = await this.requireShareScope(
      actor,
      source.student,
      targetStudentId,
      "plans.create",
    );
    const targetDate = date || source.date;
    let copy = await this.plans.findOne({
      where: { student: { id: target.id }, date: targetDate },
      relations: { tasks: true },
    });
    if (copy) await this.tasks.delete({ plan: { id: copy.id } });
    else
      copy = await this.plans.save(
        this.plans.create({
          student: target,
          date: targetDate,
          status: source.status,
        }),
      );
    Object.assign(copy, planCopyValues(source));
    await this.plans.save(copy);
    copy.tasks = source.tasks.map((task) =>
      this.tasks.create({
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
      }),
    );
    await this.tasks.save(copy.tasks);
    return this.plans.findOneOrFail({
      where: { id: copy.id },
      relations: { tasks: true, student: true },
    });
  }

  async sharePlanRange(
    actor: AuthenticatedUser,
    planId: string,
    dto: SharePlanRangeDto,
  ) {
    const anchor = await this.plans.findOne({
      where: { id: planId },
      relations: { student: { user: true } },
    });
    if (!anchor)
      throw new ApiException(404, "PLAN_NOT_FOUND", "برنامه پیدا نشد.");
    const prepared = await this.prepareRange(actor, anchor, dto);
    const { from, targetStartDate, conflictPolicy, sourcePlans, targets } =
      prepared;

    const result = await this.plans.manager.transaction(async (manager) => {
      let copied = 0;
      let skipped = 0;
      for (const target of targets) {
        for (const source of sourcePlans) {
          const destinationDate = addDays(
            targetStartDate,
            daysBetween(from, source.date),
          );
          const outcome = await this.copyPlan(
            manager,
            source,
            target,
            destinationDate,
            conflictPolicy,
          );
          copied += outcome === "copied" ? 1 : 0;
          skipped += outcome === "skipped" ? 1 : 0;
        }
      }
      await manager.getRepository(AuditLog).save(
        manager.getRepository(AuditLog).create({
          user: { id: actor.id } as never,
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
        }),
      );
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

  async previewPlanRange(
    actor: AuthenticatedUser,
    planId: string,
    dto: SharePlanRangeDto,
  ) {
    const anchor = await this.plans.findOne({
      where: { id: planId },
      relations: { student: { user: true } },
    });
    if (!anchor)
      throw new ApiException(404, "PLAN_NOT_FOUND", "برنامه پیدا نشد.");
    const prepared = await this.prepareRange(actor, anchor, dto);
    const targetIds = prepared.targets.map((target) => target.id);
    const dates = prepared.sourcePlans.flatMap((source) =>
      targetIds.map((studentId) => ({
        studentId,
        date: addDays(
          prepared.targetStartDate,
          daysBetween(prepared.from, source.date),
        ),
        source,
      })),
    );
    const existing = dates.length
      ? await this.plans.find({
          where: dates.map(({ studentId, date }) => ({
            student: { id: studentId },
            date,
          })),
          relations: { student: true, tasks: true },
        })
      : [];
    const existingByTargetDate = new Map(
      existing.map((plan) => [`${plan.student.id}:${plan.date}`, plan]),
    );
    const recipients = prepared.targets.map((target) => {
      const days = prepared.sourcePlans.map((source) => {
        const date = addDays(
          prepared.targetStartDate,
          daysBetween(prepared.from, source.date),
        );
        const destination = existingByTargetDate.get(`${target.id}:${date}`);
        const conflicts = destination
          ? source.tasks.reduce(
              (count, task) =>
                count +
                destination.tasks.filter((candidate) =>
                  overlaps(
                    task.startTime,
                    task.endTime,
                    candidate.startTime,
                    candidate.endTime,
                  ),
                ).length,
              0,
            )
          : 0;
        const examCollisions = destination
          ? source.tasks.reduce(
              (count, task) =>
                count +
                destination.tasks.filter(
                  (candidate) =>
                    isExamTask(task) &&
                    isExamTask(candidate) &&
                    overlaps(
                      task.startTime,
                      task.endTime,
                      candidate.startTime,
                      candidate.endTime,
                    ),
                ).length,
              0,
            )
          : 0;
        const plannedMinutes = source.tasks.reduce(
          (sum, task) =>
            sum + taskMinutes(task.duration, task.startTime, task.endTime),
          0,
        );
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
        timeConflictCount: days.reduce(
          (sum, day) => sum + day.timeConflicts,
          0,
        ),
        examCollisionCount: days.reduce(
          (sum, day) => sum + day.examCollisions,
          0,
        ),
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
        existingPlanCount: recipients.reduce(
          (sum, recipient) => sum + recipient.existingPlanCount,
          0,
        ),
        emptyDestinationDayCount: recipients.reduce(
          (sum, recipient) => sum + recipient.emptyDestinationDayCount,
          0,
        ),
        timeConflictCount: recipients.reduce(
          (sum, recipient) => sum + recipient.timeConflictCount,
          0,
        ),
        examCollisionCount: recipients.reduce(
          (sum, recipient) => sum + recipient.examCollisionCount,
          0,
        ),
        overCapacityDayCount: recipients.reduce(
          (sum, recipient) => sum + recipient.overCapacityDayCount,
          0,
        ),
        proposedMinutes: recipients.reduce(
          (sum, recipient) => sum + recipient.proposedMinutes,
          0,
        ),
      },
    };
  }

  async planHistory(actor: AuthenticatedUser) {
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

  async shareResource(
    actor: AuthenticatedUser,
    resourceId: string,
    targetStudentId: string,
  ) {
    const resource = await this.resources.findOne({
      where: { id: resourceId, status: "PUBLISHED" },
      relations: { assignments: { student: { user: true } }, createdBy: true },
    });
    if (!resource)
      throw new ApiException(
        404,
        "LEARNING_RESOURCE_NOT_FOUND",
        "محتوای آموزشی پیدا نشد.",
      );
    const roles = actor.roles || [actor.role];
    const actorStudent = await this.students.findOne({
      where: { user: { id: actor.id } },
      relations: { user: true },
    });
    let target: Student;
    if (roles.includes("STUDENT")) {
      const source = actorStudent
        ? resource.assignments.find(
            (item) => item.student.id === actorStudent.id,
          )?.student
        : undefined;
      if (!source)
        throw new ApiException(
          403,
          "RESOURCE_SHARE_FORBIDDEN",
          "این محتوا برای اشتراک‌گذاری در دسترس شما نیست.",
        );
      target = await this.requireShareScope(
        actor,
        source,
        targetStudentId,
        "learning_resources.manage",
      );
    } else {
      target = await this.requireStaffResourceScope(
        actor,
        resource,
        targetStudentId,
      );
    }
    const existing = await this.assignments.findOne({
      where: { resource: { id: resource.id }, student: { id: target.id } },
    });
    if (!existing)
      await this.assignments.save(
        this.assignments.create({ resource, student: target }),
      );
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

  private async prepareRange(
    actor: AuthenticatedUser,
    anchor: Plan,
    dto: SharePlanRangeDto,
  ) {
    const from = dto.sourceFrom || anchor.date;
    const to = dto.sourceTo || anchor.date;
    if (from > to)
      throw new ApiException(
        400,
        "SHARE_RANGE_INVALID",
        "ابتدای بازه باید پیش از انتهای بازه باشد.",
      );
    if (daysBetween(from, to) > 366)
      throw new ApiException(
        400,
        "SHARE_RANGE_TOO_LARGE",
        "بازه اشتراک‌گذاری حداکثر یک سال است.",
      );
    const targetStartDate = dto.targetStartDate || from;
    const conflictPolicy = dto.conflictPolicy || "skip";
    const sourcePlans = await this.plans.find({
      where: { student: { id: anchor.student.id }, date: Between(from, to) },
      relations: { student: { user: true }, tasks: true },
      order: { date: "ASC" },
    });
    if (!sourcePlans.length)
      throw new ApiException(
        404,
        "PLAN_RANGE_EMPTY",
        "برنامه‌ای در بازه انتخاب‌شده پیدا نشد.",
      );
    const targetIds = [...new Set(dto.targetStudentIds || [])];
    if (!targetIds.length)
      throw new ApiException(
        400,
        "SHARE_TARGETS_REQUIRED",
        "حداقل یک دانش‌آموز مقصد انتخاب کنید.",
      );
    const targets = await Promise.all(
      targetIds.map((targetId) =>
        this.requireShareScope(actor, anchor.student, targetId, "plans.create"),
      ),
    );
    return { from, to, targetStartDate, conflictPolicy, sourcePlans, targets };
  }

  private auditOrganizationId(actor: AuthenticatedUser) {
    const organizationIds = this.context(actor).organizationIds;
    return organizationIds.length === 1 ? organizationIds[0] : null;
  }

  private async requireStaffResourceScope(
    actor: AuthenticatedUser,
    resource: LearningResource,
    targetStudentId: string,
  ) {
    const target = await this.students.findOne({
      where: { id: targetStudentId },
      relations: { user: true },
    });
    if (!target || target.accountStatus !== "active")
      throw new ApiException(
        404,
        "SHARE_TARGET_NOT_FOUND",
        "دانش‌آموز گیرنده پیدا نشد.",
      );
    const context = this.context(actor);
    const platform = context.roles.includes("PLATFORM_ADMIN");
    const managesTarget = await this.authorization.canAccessStudent(
      context,
      target.id,
      "learning_resources.manage",
    );
    const managesSources =
      resource.assignments.length > 0 &&
      (
        await Promise.all(
          resource.assignments.map((item) =>
            this.authorization.canAccessStudent(
              context,
              item.student.id,
              "learning_resources.manage",
            ),
          ),
        )
      ).every(Boolean);
    if (
      !managesTarget ||
      (!platform && resource.createdBy.id !== actor.id && !managesSources)
    )
      throw new ApiException(
        403,
        "SHARE_SCOPE_FORBIDDEN",
        "این محتوا یا دانش‌آموز خارج از محدوده دسترسی شما است.",
      );
    return target;
  }

  private async copyPlan(
    manager: EntityManager,
    source: Plan,
    target: Student,
    date: string,
    conflictPolicy: "skip" | "overwrite",
  ) {
    const plans = manager.getRepository(Plan);
    const tasks = manager.getRepository(Task);
    let copy = await plans.findOne({
      where: { student: { id: target.id }, date },
      relations: { tasks: true },
    });
    if (copy && conflictPolicy === "skip") return "skipped" as const;
    if (copy) await tasks.delete({ plan: { id: copy.id } });
    else
      copy = await plans.save(
        plans.create({ student: target, date, status: source.status }),
      );
    Object.assign(copy, planCopyValues(source));
    await plans.save(copy);
    copy.tasks = source.tasks.map((task) =>
      tasks.create({
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
      }),
    );
    await tasks.save(copy.tasks);
    return "copied" as const;
  }

  private async requireShareScope(
    actor: AuthenticatedUser,
    source: Student,
    targetStudentId: string,
    staffCapability: string,
  ) {
    if (source.id === targetStudentId)
      throw new ApiException(
        400,
        "SHARE_TARGET_SAME_STUDENT",
        "گیرنده باید دانش‌آموز دیگری باشد.",
      );
    const target = await this.students.findOne({
      where: { id: targetStudentId },
      relations: { user: true },
    });
    if (!target || target.accountStatus !== "active")
      throw new ApiException(
        404,
        "SHARE_TARGET_NOT_FOUND",
        "دانش‌آموز گیرنده پیدا نشد.",
      );
    const roles = actor.roles || [actor.role];
    if (roles.includes("STUDENT")) {
      if (
        source.user?.id !== actor.id ||
        !(await this.shareOrganization(source, target))
      )
        throw new ApiException(
          403,
          "SHARE_SCOPE_FORBIDDEN",
          "اشتراک‌گذاری فقط با دانش‌آموزان سازمان مشترک مجاز است.",
        );
      return target;
    }
    const context = this.context(actor);
    if (
      !(await this.authorization.canAccessStudent(
        context,
        source.id,
        staffCapability,
      )) ||
      !(await this.authorization.canAccessStudent(
        context,
        target.id,
        staffCapability,
      ))
    )
      throw new ApiException(
        403,
        "SHARE_SCOPE_FORBIDDEN",
        "یک یا چند دانش‌آموز خارج از محدوده دسترسی شما هستند.",
      );
    return target;
  }

  private async studentForActor(actor: AuthenticatedUser) {
    const student = await this.students.findOne({
      where: { user: { id: actor.id } },
      relations: { user: true },
    });
    if (!student)
      throw new ApiException(
        404,
        "STUDENT_NOT_FOUND",
        "پرونده دانش‌آموز پیدا نشد.",
      );
    return student;
  }
  private async shareOrganization(left: Student, right: Student) {
    if (!left.user || !right.user) return false;
    const [leftIds, rightIds] = await Promise.all([
      this.activeOrganizationIds(left.user.id),
      this.activeOrganizationIds(right.user.id),
    ]);
    return leftIds.some((id) => rightIds.includes(id));
  }
  private async activeOrganizationIds(userId: string) {
    const rows = await this.memberships.find({
      where: { user: { id: userId }, status: MembershipStatus.ACTIVE },
      relations: { organization: true },
    });
    return rows.map((row) => row.organization.id);
  }
  private context(actor: AuthenticatedUser): UserContext {
    return {
      ...actor,
      roles: actor.roles || [actor.role],
      capabilities: actor.capabilities || [],
      membershipIds: actor.membershipIds || [],
      organizationIds: actor.organizationIds || [],
    };
  }
}

function planCopyValues(source: Plan) {
  return {
    status: source.status,
    title: source.title,
    dayLabel: source.dayLabel,
    persianDate: source.persianDate,
    jalaliId: source.jalaliId,
    motivationText: source.motivationText,
  };
}

function daysBetween(from: string, to: string) {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86400000,
  );
}

function addDays(date: string, offset: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function overlaps(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  if (!firstStart || !firstEnd || !secondStart || !secondEnd) return false;
  return firstStart < secondEnd && secondStart < firstEnd;
}

function taskMinutes(duration: number, start: string, end: string) {
  if (Number.isFinite(duration) && duration > 0) return duration;
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return 0;
  const toMinutes = (value: string) =>
    Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  return Math.max(0, toMinutes(end) - toMinutes(start));
}

function dailyCapacityMinutes(value?: string) {
  const numeric = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric * 60 : 600;
}

function isExamTask(task: Task) {
  return task.type === "EXAM" || Boolean(task.examId || task.examRef);
}
