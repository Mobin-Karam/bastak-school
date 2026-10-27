import { attendanceTransaction } from "../attendance";
import { ImportHistory } from "../../database/entities/import-history.entity";
import { EntityManager } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassBook } from "../../database/entities/education-class-book.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import {
  MembershipStatus,
  OrganizationMembership,
} from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { SchoolScheduleEntry } from "../../database/entities/school-schedule-entry.entity";
import { SchoolScheduleTimeBlock } from "../../database/entities/school-schedule-time-block.entity";
import {
  SchoolScheduleOccurrenceOverride,
  SchoolScheduleSubstitutionRequest,
} from "../../database/entities/school-schedule-substitution.entity";
import {
  SchoolScheduleTemplate,
  type ScheduleTemplateEntry,
} from "../../database/entities/school-schedule-template.entity";
import { User } from "../../database/entities/user.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService, UserContext } from "../authorization";
import {
  ArchiveScheduleEntryDto,
  CreateScheduleTimeBlockDto,
  CreateScheduleTemplateDto,
  SaveScheduleEntryDto,
  ScheduleSubstitutionDecisionDto,
  ScheduleSubstitutionRequestDto,
} from "./schedule.dto";

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(SchoolScheduleEntry)
    private readonly entries: Repository<SchoolScheduleEntry>,
    @InjectRepository(SchoolScheduleTimeBlock)
    private readonly timeBlocks: Repository<SchoolScheduleTimeBlock>,
    @InjectRepository(SchoolScheduleTemplate)
    private readonly templates: Repository<SchoolScheduleTemplate>,
    @InjectRepository(SchoolScheduleOccurrenceOverride)
    private readonly occurrenceOverrides: Repository<SchoolScheduleOccurrenceOverride>,
    @InjectRepository(SchoolScheduleSubstitutionRequest)
    private readonly substitutions: Repository<SchoolScheduleSubstitutionRequest>,
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    @InjectRepository(EducationClass)
    private readonly classes: Repository<EducationClass>,
    @InjectRepository(EducationClassBook)
    private readonly classBooks: Repository<EducationClassBook>,
    private readonly authorization: AuthorizationService,
  ) {}
  private context(user: AuthenticatedUser): UserContext {
    return {
      ...user,
      roles: user.roles || [user.role],
      capabilities: user.capabilities || [],
      membershipIds: user.membershipIds || [],
      organizationIds: user.organizationIds || [],
    };
  }
  private isOperator(context: UserContext) {
    return context.roles.some((role) =>
      ["PLATFORM_ADMIN", "ORGANIZATION_ADMIN", "PRINCIPAL"].includes(role),
    );
  }
  private weekdayForDate(date: string) {
    return (new Date(`${date}T12:00:00Z`).getUTCDay() + 1) % 7;
  }
  private dateIsValid(date: string) {
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(`${date}T12:00:00Z`))
    );
  }
  private isTeacherEntry(entry: SchoolScheduleEntry, userId: string) {
    return (
      entry.teacher?.id === userId || entry.classBook?.teacher?.id === userId
    );
  }
  private publicSubstitution(row: SchoolScheduleSubstitutionRequest) {
    return {
      id: row.id,
      sourceEntryId: row.sourceEntryId,
      targetEntryId: row.targetEntryId,
      freezeDate: row.freezeDate,
      replacementDate: row.replacementDate,
      replacementTimeBlockId: row.replacementTimeBlockId,
      title: row.title,
      message: row.message,
      status: row.status,
      requestedById: row.requestedById,
      reviewedById: row.reviewedById,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      replacementEntryId: row.replacementEntryId,
      counterpartReplacementEntryId: row.counterpartReplacementEntryId,
      createdAt: row.createdAt.toISOString(),
      source: row.sourceEntry ? this.publicEntry(row.sourceEntry) : undefined,
      target: row.targetEntry ? this.publicEntry(row.targetEntry) : undefined,
      replacementTimeBlock: row.replacementTimeBlock
        ? {
            id: row.replacementTimeBlock.id,
            name: row.replacementTimeBlock.name,
            startTime: row.replacementTimeBlock.startTime,
            endTime: row.replacementTimeBlock.endTime,
          }
        : undefined,
    };
  }
  async substitutionRequests(user: AuthenticatedUser) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.read");
    const operator =
      user.capabilities?.includes("schedule.publish") &&
      this.isOperator(context);
    const rows = await this.substitutions.find({
      where: operator ? {} : { requestedById: user.id },
      relations: {
        sourceEntry: {
          organization: true,
          classroom: true,
          teacher: true,
          classBook: { book: true, teacher: true },
        },
        targetEntry: {
          organization: true,
          classroom: true,
          teacher: true,
          classBook: { book: true, teacher: true },
        },
        replacementTimeBlock: true,
      },
      order: { createdAt: "DESC" },
    });
    return rows
      .filter((row) =>
        operator
          ? context.roles.includes("PLATFORM_ADMIN") ||
            context.organizationIds.includes(row.sourceEntry!.organization.id)
          : this.isTeacherEntry(row.sourceEntry!, user.id),
      )
      .map((row) => this.publicSubstitution(row));
  }
  async substitutionSlots(user: AuthenticatedUser, date: string) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.read");
    if (!this.dateIsValid(date))
      throw new ApiException(
        422,
        "SCHEDULE_DATE_INVALID",
        "تاریخ جلسه معتبر نیست.",
      );
    const entries = await this.entries.find({
      where: {
        versionId: IsNull(),
        status: "ACTIVE",
        organization: { id: In(context.organizationIds) },
      },
      relations: {
        organization: true,
        classroom: true,
        teacher: true,
        classBook: { book: true, teacher: true },
      },
      order: { startTime: "ASC" },
    });
    const overrides = await this.occurrenceOverrides.find({ where: { date } });
    const cancelled = new Set(
      overrides.filter((row) => row.cancelled).map((row) => row.entryId),
    );
    return entries
      .filter(
        (entry) =>
          entry.weekday === this.weekdayForDate(date) &&
          (!entry.startsOn || entry.startsOn <= date) &&
          (!entry.endsOn || entry.endsOn >= date) &&
          !cancelled.has(entry.id),
      )
      .map((entry) => this.publicEntry(entry));
  }
  async requestSubstitution(
    user: AuthenticatedUser,
    dto: ScheduleSubstitutionRequestDto,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "attendance.class.manage");
    if (
      !this.dateIsValid(dto.freezeDate) ||
      !this.dateIsValid(dto.replacementDate)
    )
      throw new ApiException(
        422,
        "SCHEDULE_DATE_INVALID",
        "تاریخ جلسه معتبر نیست.",
      );
    const source = await this.entries.findOne({
      where: { id: dto.sourceEntryId, versionId: IsNull(), status: "ACTIVE" },
      relations: {
        organization: true,
        classroom: true,
        teacher: true,
        classBook: { book: true, teacher: true },
      },
    });
    if (
      !source ||
      !this.isTeacherEntry(source, user.id) ||
      this.weekdayForDate(dto.freezeDate) !== source.weekday ||
      (source.startsOn && source.startsOn > dto.freezeDate) ||
      (source.endsOn && source.endsOn < dto.freezeDate)
    )
      throw new ApiException(
        403,
        "SCHEDULE_SUBSTITUTION_FORBIDDEN",
        "فقط دبیر جلسه اصلی می‌تواند همان نوبت را جابه‌جا کند.",
      );
    if (
      !context.organizationIds.includes(source.organization.id) &&
      !context.roles.includes("PLATFORM_ADMIN")
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const target = await this.entries.findOne({
      where: { id: dto.targetEntryId, versionId: IsNull(), status: "ACTIVE" },
      relations: {
        organization: true,
        classroom: true,
        teacher: true,
        classBook: { book: true, teacher: true },
      },
    });
    if (
      !target ||
      target.id === source.id ||
      target.organization.id !== source.organization.id ||
      target.weekday !== this.weekdayForDate(dto.replacementDate) ||
      (target.startsOn && target.startsOn > dto.replacementDate) ||
      (target.endsOn && target.endsOn < dto.replacementDate)
    )
      throw new ApiException(
        422,
        "SCHEDULE_SWAP_TARGET_INVALID",
        "جلسه مقصد در تاریخ انتخاب‌شده قابل جابه‌جایی نیست.",
      );
    const timeBlock = await this.timeBlocks.findOne({
      where: {
        id: dto.replacementTimeBlockId,
        organization: { id: source.organization.id },
      },
      relations: { organization: true },
    });
    if (!timeBlock)
      throw new ApiException(
        422,
        "SCHEDULE_TIME_BLOCK_INVALID",
        "بازه زمانی این مدرسه پیدا نشد.",
      );
    if (
      target.startTime !== timeBlock.startTime ||
      target.endTime !== timeBlock.endTime
    )
      throw new ApiException(
        422,
        "SCHEDULE_SWAP_TARGET_INVALID",
        "جلسه انتخاب‌شده با بازه زمانی مقصد یکسان نیست.",
      );
    const row = await this.substitutions.save(
      this.substitutions.create({
        sourceEntry: source,
        sourceEntryId: source.id,
        targetEntry: target,
        targetEntryId: target.id,
        freezeDate: dto.freezeDate,
        replacementDate: dto.replacementDate,
        replacementTimeBlock: timeBlock,
        replacementTimeBlockId: timeBlock.id,
        title: dto.title.trim(),
        message: dto.message?.trim() || "",
        requestedById: user.id,
        reviewedById: null,
        reviewedAt: null,
        replacementEntryId: null,
        counterpartReplacementEntryId: null,
        status: "pending",
      }),
    );
    return this.publicSubstitution({
      ...row,
      sourceEntry: source,
      targetEntry: target,
      replacementTimeBlock: timeBlock,
    });
  }
  async reviewSubstitution(
    user: AuthenticatedUser,
    id: string,
    dto: ScheduleSubstitutionDecisionDto,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.publish");
    return attendanceTransaction(this.entries.manager, async (manager) => {
      const request = await manager.findOne(SchoolScheduleSubstitutionRequest, {
        where: { id },
        relations: {
          sourceEntry: {
            organization: true,
            classroom: true,
            teacher: true,
            classBook: { book: true, teacher: true },
          },
          targetEntry: {
            organization: true,
            classroom: true,
            teacher: true,
            classBook: { book: true, teacher: true },
          },
          replacementTimeBlock: true,
        },
      });
      if (!request || request.status !== "pending")
        throw new ApiException(
          404,
          "SCHEDULE_SUBSTITUTION_NOT_FOUND",
          "درخواست در انتظار بررسی پیدا نشد.",
        );
      const source = request.sourceEntry!;
      const target = request.targetEntry!;
      if (
        !this.isOperator(context) ||
        (!context.roles.includes("PLATFORM_ADMIN") &&
          !context.organizationIds.includes(source.organization.id))
      )
        throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
      request.status = dto.decision;
      request.reviewedById = user.id;
      request.reviewedAt = new Date();
      if (dto.decision === "approved") {
        const block = request.replacementTimeBlock!;
        if (
          source.status !== "ACTIVE" ||
          target.status !== "ACTIVE" ||
          source.organization.id !== target.organization.id ||
          source.weekday !== this.weekdayForDate(request.freezeDate) ||
          target.weekday !== this.weekdayForDate(request.replacementDate) ||
          (source.startsOn && source.startsOn > request.freezeDate) ||
          (source.endsOn && source.endsOn < request.freezeDate) ||
          (target.startsOn && target.startsOn > request.replacementDate) ||
          (target.endsOn && target.endsOn < request.replacementDate) ||
          target.startTime !== block.startTime ||
          target.endTime !== block.endTime
        )
          throw new ApiException(
            409,
            "SCHEDULE_SWAP_TARGET_INVALID",
            "یکی از جلسه‌های انتخاب‌شده دیگر در تاریخ یا بازه درخواستی قابل جابه‌جایی نیست.",
          );
        const existing = await manager.findOneBy(
          SchoolScheduleOccurrenceOverride,
          {
            entryId: source.id,
            date: request.freezeDate,
          },
        );
        if (existing)
          throw new ApiException(
            409,
            "SCHEDULE_SUBSTITUTION_CONFLICT",
            "برای این جلسه در این تاریخ تغییر دیگری ثبت شده است.",
          );
        await manager.save(
          manager.create(SchoolScheduleOccurrenceOverride, {
            ...(existing ?? {}),
            entryId: source.id,
            date: request.freezeDate,
            cancelled: true,
            changedById: user.id,
          }),
        );
        const targetExisting = await manager.findOneBy(
          SchoolScheduleOccurrenceOverride,
          { entryId: target.id, date: request.replacementDate },
        );
        if (targetExisting)
          throw new ApiException(
            409,
            "SCHEDULE_SUBSTITUTION_CONFLICT",
            "برای جلسه مقصد در این تاریخ تغییر دیگری ثبت شده است.",
          );
        await manager.save(
          manager.create(SchoolScheduleOccurrenceOverride, {
            ...(targetExisting ?? {}),
            entryId: target.id,
            date: request.replacementDate,
            cancelled: true,
            changedById: user.id,
          }),
        );
        const replacement = await manager.save(
          manager.create(SchoolScheduleEntry, {
            organization: source.organization,
            classroom: source.classroom,
            classBook: source.classBook,
            teacher: source.teacher,
            title: request.title,
            weekday: this.weekdayForDate(request.replacementDate),
            startTime: block.startTime,
            endTime: block.endTime,
            room: source.room,
            status: "REPLACED",
            versionId: null,
            periodId: null,
            locationId: null,
            startsOn: request.replacementDate,
            endsOn: request.replacementDate,
            notes: request.message,
            classroomNameSnapshot: source.classroomNameSnapshot,
            teacherNameSnapshot: source.teacherNameSnapshot,
          }),
        );
        request.replacementEntryId = replacement.id;
        const counterpart = await manager.save(
          manager.create(SchoolScheduleEntry, {
            organization: target.organization,
            classroom: target.classroom,
            classBook: target.classBook,
            teacher: target.teacher,
            title: target.title,
            weekday: this.weekdayForDate(request.freezeDate),
            startTime: source.startTime,
            endTime: source.endTime,
            room: source.room,
            status: "REPLACED",
            versionId: null,
            periodId: null,
            locationId: null,
            startsOn: request.freezeDate,
            endsOn: request.freezeDate,
            notes: request.message,
            classroomNameSnapshot: target.classroomNameSnapshot,
            teacherNameSnapshot: target.teacherNameSnapshot,
          }),
        );
        request.counterpartReplacementEntryId = counterpart.id;
      }
      const saved = await manager.save(request);
      return this.publicSubstitution(saved);
    });
  }
  async list(user: AuthenticatedUser, organizationId?: string) {
    return (await this.listEntities(user, organizationId)).map((entry) =>
      this.publicEntry(entry),
    );
  }
  private async listEntities(user: AuthenticatedUser, organizationId?: string) {
    const requestedOrganizationId = organizationId ?? user.activeOrganizationId;
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.read");
    if (
      requestedOrganizationId &&
      !context.roles.includes("PLATFORM_ADMIN") &&
      !context.organizationIds.includes(requestedOrganizationId)
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    if (context.roles.includes("PLATFORM_ADMIN"))
      return this.entries.find({
        where: requestedOrganizationId
          ? {
              organization: { id: requestedOrganizationId },
              versionId: IsNull(),
              status: In(["ACTIVE", "ARCHIVED"]),
            }
          : { versionId: IsNull(), status: In(["ACTIVE", "ARCHIVED"]) },
        relations: {
          organization: true,
          classroom: true,
          teacher: true,
          classBook: { book: true, teacher: true },
        },
        order: { weekday: "ASC", startTime: "ASC" },
      });
    if (this.isOperator(context))
      return this.entries.find({
        where: {
          versionId: IsNull(),
          status: In(["ACTIVE", "ARCHIVED"]),
          organization: {
            id: In(
              requestedOrganizationId
                ? [requestedOrganizationId]
                : context.organizationIds,
            ),
          },
        },
        relations: {
          organization: true,
          classroom: true,
          teacher: true,
          classBook: { book: true, teacher: true },
        },
        order: { weekday: "ASC", startTime: "ASC" },
      });
    if (context.roles.includes("TEACHER"))
      return this.entries.find({
        where: {
          versionId: IsNull(),
          teacher: { id: user.id },
          classBook: { teacher: { id: user.id } },
          organization: {
            id: In(
              requestedOrganizationId
                ? [requestedOrganizationId]
                : context.organizationIds,
            ),
          },
          status: In(["ACTIVE", "REPLACED"]),
        },
        relations: {
          organization: true,
          classroom: true,
          teacher: true,
          classBook: { book: true, teacher: true },
        },
        order: { weekday: "ASC", startTime: "ASC" },
      });
    if (
      context.roles.some((role) =>
        ["ADVISOR", "MENTOR", "COUNSELOR", "STUDENT_AFFAIRS_MENTOR"].includes(
          role,
        ),
      )
    ) {
      if (!context.organizationIds.length) return [];
      return this.entries.find({
        where: {
          versionId: IsNull(),
          classroom: { advisor: { id: user.id } },
          organization: {
            id: In(
              requestedOrganizationId
                ? [requestedOrganizationId]
                : context.organizationIds,
            ),
          },
          status: "ACTIVE",
        },
        relations: {
          organization: true,
          classroom: { advisor: true },
          teacher: true,
        },
        order: { weekday: "ASC", startTime: "ASC" },
      });
    }
    if (context.roles.includes("GUARDIAN")) {
      const organizationIds = requestedOrganizationId
        ? [requestedOrganizationId]
        : context.organizationIds;
      if (!organizationIds.length) return [];
      return this.entries
        .createQueryBuilder("entry")
        .leftJoinAndSelect("entry.organization", "organization")
        .leftJoinAndSelect("entry.classroom", "classroom")
        .leftJoinAndSelect("entry.teacher", "teacher")
        .leftJoinAndSelect("entry.classBook", "classBook")
        .leftJoinAndSelect("classBook.book", "classBookBook")
        .leftJoinAndSelect("classBook.teacher", "classBookTeacher")
        .leftJoin(
          EducationClassEnrollment,
          "enrollment",
          "enrollment.classroomId = entry.classroomId",
        )
        .leftJoin(
          UserRelationship,
          "relationship",
          "relationship.toStudentId = enrollment.studentId AND relationship.fromUserId = :userId AND relationship.organizationId = entry.organizationId AND relationship.status = 'ACTIVE' AND relationship.type = 'GUARDIAN_OF'",
          { userId: user.id },
        )
        .where("entry.status = 'ACTIVE'")
        .andWhere("entry.versionId IS NULL")
        .andWhere("entry.organizationId IN (:...organizationIds)", {
          organizationIds,
        })
        .andWhere("entry.classroomId IS NULL OR relationship.id IS NOT NULL")
        .orderBy("entry.weekday", "ASC")
        .addOrderBy("entry.startTime", "ASC")
        .getMany();
    }
    if (context.roles.includes("STUDENT")) {
      const organizationIds = requestedOrganizationId
        ? [requestedOrganizationId]
        : context.organizationIds;
      if (!organizationIds.length) return [];
      return this.entries
        .createQueryBuilder("entry")
        .leftJoinAndSelect("entry.organization", "organization")
        .leftJoinAndSelect("entry.classroom", "classroom")
        .leftJoinAndSelect("entry.teacher", "teacher")
        .leftJoinAndSelect("entry.classBook", "classBook")
        .leftJoinAndSelect("classBook.book", "classBookBook")
        .leftJoinAndSelect("classBook.teacher", "classBookTeacher")
        .leftJoin(
          EducationClassEnrollment,
          "enrollment",
          "enrollment.classroomId = entry.classroomId AND enrollment.studentId = (SELECT id FROM students WHERE userId = :userId LIMIT 1)",
          { userId: user.id },
        )
        .where("entry.status = 'ACTIVE'")
        .andWhere("entry.versionId IS NULL")
        .andWhere("entry.organizationId IN (:...organizationIds)", {
          organizationIds,
        })
        .andWhere("entry.classroomId IS NULL OR enrollment.id IS NOT NULL")
        .orderBy("entry.weekday", "ASC")
        .addOrderBy("entry.startTime", "ASC")
        .getMany();
    }
    if (context.organizationIds.length) {
      return this.entries.find({
        where: {
          versionId: IsNull(),
          organization: {
            id: In(
              requestedOrganizationId
                ? [requestedOrganizationId]
                : context.organizationIds,
            ),
          },
          status: "ACTIVE",
        },
        relations: { organization: true, classroom: true, teacher: true },
        order: { weekday: "ASC", startTime: "ASC" },
      });
    }
    // Do not replace an unknown/limited role with an organization-wide feed.
    return [];
  }
  async export(user: AuthenticatedUser, organizationId?: string) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.export");
    return this.list(
      {
        ...user,
        capabilities: [
          ...new Set([...(user.capabilities || []), "schedule.read"]),
        ],
      },
      organizationId,
    );
  }
  async listTimeBlocks(user: AuthenticatedUser, organizationId?: string) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.read");
    const requestedOrganizationId = organizationId ?? user.activeOrganizationId;
    if (
      requestedOrganizationId &&
      !context.roles.includes("PLATFORM_ADMIN") &&
      !context.organizationIds.includes(requestedOrganizationId)
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    if (context.roles.includes("PLATFORM_ADMIN"))
      return this.timeBlocks.find({
        where: requestedOrganizationId
          ? { organization: { id: requestedOrganizationId } }
          : {},
        relations: { organization: true },
        order: { name: "ASC" },
      });
    if (!context.organizationIds.length) return [];
    return this.timeBlocks.find({
      where: {
        organization: {
          id: In(
            requestedOrganizationId
              ? [requestedOrganizationId]
              : context.organizationIds,
          ),
        },
      },
      relations: { organization: true },
      order: { name: "ASC" },
    });
  }
  async listTemplates(
    user: AuthenticatedUser,
    requestedOrganizationId?: string,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.read");
    const organizationId = requestedOrganizationId ?? user.activeOrganizationId;
    if (
      !organizationId ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(organizationId))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    return this.templates.find({
      where: { organization: { id: organizationId } },
      order: { updatedAt: "DESC" },
    });
  }
  private async templateScope(
    user: AuthenticatedUser,
    organizationId: string,
    capability: string,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, capability);
    if (
      !this.isOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(organizationId))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const organization = await this.organizations.findOneBy({
      id: organizationId,
    });
    if (!organization)
      throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
    return organization;
  }
  private async templateSnapshot(
    organizationId: string,
  ): Promise<ScheduleTemplateEntry[]> {
    const rows = await this.entries.find({
      where: {
        organization: { id: organizationId },
        versionId: IsNull(),
        status: "ACTIVE",
      },
      relations: { classroom: true, classBook: true, teacher: true },
    });
    return rows.map((row) => ({
      classroomId: row.classroom?.id,
      classBookId: row.classBook?.id,
      teacherId: row.teacher?.id,
      title: row.title,
      weekday: row.weekday,
      startTime: row.startTime,
      endTime: row.endTime,
      room: row.room,
    }));
  }
  async createTemplate(
    user: AuthenticatedUser,
    dto: CreateScheduleTemplateDto,
  ) {
    const organization = await this.templateScope(
      user,
      dto.organizationId,
      "schedule.create",
    );
    const name = dto.name.trim();
    if (!name)
      throw new ApiException(
        422,
        "SCHEDULE_TEMPLATE_NAME_REQUIRED",
        "نام الگو لازم است.",
      );
    const entries = dto.sourceTemplateId
      ? (
          await this.templateForOrganization(
            dto.sourceTemplateId,
            organization.id,
          )
        ).entries
      : await this.templateSnapshot(organization.id);
    if (!entries.length)
      throw new ApiException(
        422,
        "SCHEDULE_TEMPLATE_EMPTY",
        "برنامه فعالی برای ساخت الگو وجود ندارد.",
      );
    return this.templates.save(
      this.templates.create({ organization, name, entries }),
    );
  }
  private async templateForOrganization(id: string, organizationId: string) {
    const template = await this.templates.findOne({
      where: { id, organization: { id: organizationId } },
      relations: { organization: true },
    });
    if (!template)
      throw new ApiException(
        404,
        "SCHEDULE_TEMPLATE_NOT_FOUND",
        "الگوی برنامه پیدا نشد.",
      );
    return template;
  }
  async applyTemplate(user: AuthenticatedUser, id: string) {
    const template = await this.templates.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!template)
      throw new ApiException(
        404,
        "SCHEDULE_TEMPLATE_NOT_FOUND",
        "الگوی برنامه پیدا نشد.",
      );
    await this.templateScope(user, template.organization.id, "schedule.update");
    if (template.state === "ARCHIVED")
      throw new ApiException(
        409,
        "SCHEDULE_TEMPLATE_ARCHIVED",
        "الگوی بایگانی‌شده قابل اجرا نیست.",
      );
    return attendanceTransaction(this.entries.manager, async (manager) => {
      await manager.update(
        SchoolScheduleEntry,
        {
          organization: { id: template.organization.id },
          versionId: IsNull(),
          status: "ACTIVE",
        },
        { status: "REPLACED" },
      );
      const rows = template.entries.map((entry) =>
        manager.create(SchoolScheduleEntry, {
          ...entry,
          organization: template.organization,
          classroom: entry.classroomId
            ? ({ id: entry.classroomId } as EducationClass)
            : null,
          classBook: entry.classBookId
            ? ({ id: entry.classBookId } as EducationClassBook)
            : null,
          teacher: entry.teacherId ? ({ id: entry.teacherId } as User) : null,
          status: "ACTIVE",
        }),
      );
      await manager.save(rows);
      return {
        applied: rows.length,
        template: { id: template.id, name: template.name },
      };
    });
  }
  async archiveTemplate(user: AuthenticatedUser, id: string) {
    const template = await this.templates.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!template)
      throw new ApiException(
        404,
        "SCHEDULE_TEMPLATE_NOT_FOUND",
        "الگوی برنامه پیدا نشد.",
      );
    await this.templateScope(
      user,
      template.organization.id,
      "schedule.archive",
    );
    template.state = "ARCHIVED";
    return this.templates.save(template);
  }
  async restoreTemplate(user: AuthenticatedUser, id: string) {
    const template = await this.templates.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!template)
      throw new ApiException(
        404,
        "SCHEDULE_TEMPLATE_NOT_FOUND",
        "الگوی برنامه پیدا نشد.",
      );
    await this.templateScope(
      user,
      template.organization.id,
      "schedule.archive",
    );
    template.state = "ACTIVE";
    return this.templates.save(template);
  }
  async removeTemplate(user: AuthenticatedUser, id: string) {
    const template = await this.templates.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!template)
      throw new ApiException(
        404,
        "SCHEDULE_TEMPLATE_NOT_FOUND",
        "الگوی برنامه پیدا نشد.",
      );
    await this.templateScope(user, template.organization.id, "schedule.delete");
    await this.templates.remove(template);
    return { deleted: true };
  }
  async createTimeBlock(
    user: AuthenticatedUser,
    dto: CreateScheduleTimeBlockDto,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.update");
    if (
      !this.isOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(dto.organizationId))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    if (dto.endTime <= dto.startTime)
      throw new ApiException(
        422,
        "INVALID_TIME_RANGE",
        "زمان پایان باید بعد از شروع باشد.",
      );
    const organization = await this.organizations.findOneBy({
      id: dto.organizationId,
    });
    if (!organization)
      throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
    const name = dto.name.trim();
    if (!name)
      throw new ApiException(
        422,
        "TIME_BLOCK_NAME_REQUIRED",
        "نام بازه زمانی لازم است.",
      );
    const partOfDay = dto.startTime < "12:00" ? "AM" : "PM";
    const existing = await this.timeBlocks.findOne({
      where: { organization: { id: organization.id }, name, partOfDay },
    });
    if (existing)
      throw new ApiException(
        409,
        "TIME_BLOCK_NAME_EXISTS",
        "این نام بازه زمانی برای همین نیم‌روز قبلاً ثبت شده است.",
      );
    return this.timeBlocks.save(
      this.timeBlocks.create({ ...dto, name, partOfDay, organization }),
    );
  }
  async removeTimeBlock(user: AuthenticatedUser, id: string) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.update");
    const block = await this.timeBlocks.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!block)
      throw new ApiException(
        404,
        "TIME_BLOCK_NOT_FOUND",
        "بازه زمانی پیدا نشد.",
      );
    if (
      !this.isOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(block.organization.id))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    await this.timeBlocks.remove(block);
    return { deleted: true };
  }
  async create(
    user: AuthenticatedUser,
    dto: SaveScheduleEntryDto,
    manager?: EntityManager,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.create");
    if (
      !this.isOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(dto.organizationId))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const organization = await this.organizations.findOneBy({
      id: dto.organizationId,
    });
    if (!organization)
      throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
    const classroom = await this.classroomForOrganization(
      dto.classroomId,
      organization.id,
    );
    const teacher = await this.teacherForOrganization(
      dto.teacherId,
      organization.id,
    );
    const classBook = await this.classBookForSession(
      classroom,
      teacher,
      dto.classBookId,
    );
    if (dto.endTime <= dto.startTime)
      throw new ApiException(
        422,
        "INVALID_TIME_RANGE",
        "زمان پایان باید بعد از شروع باشد.",
      );
    const entries = manager?.getRepository(SchoolScheduleEntry) ?? this.entries;
    return entries
      .save(
        entries.create({
          ...dto,
          room: dto.room?.trim() || "",
          organization,
          classroom,
          classBook,
          teacher,
        }),
      )
      .then((entry) => this.publicEntry(entry));
  }
  async update(user: AuthenticatedUser, id: string, dto: SaveScheduleEntryDto) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.update");
    const item = await this.entries.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!item)
      throw new ApiException(404, "SCHEDULE_NOT_FOUND", "برنامه پیدا نشد.");
    if (
      !this.isOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(item.organization.id))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    if (item.versionId)
      throw new ApiException(
        409,
        "TIMETABLE_IMMUTABLE",
        "این درس را از نسخه برنامه درسی مدیریت کنید.",
      );
    if (dto.organizationId !== item.organization.id)
      throw new ApiException(
        422,
        "SCHEDULE_ORGANIZATION_IMMUTABLE",
        "مدرسه برنامه قابل تغییر نیست.",
      );
    if (dto.endTime <= dto.startTime)
      throw new ApiException(
        422,
        "INVALID_TIME_RANGE",
        "زمان پایان باید بعد از شروع باشد.",
      );
    const classroom = await this.classroomForOrganization(
      dto.classroomId,
      item.organization.id,
    );
    const teacher = await this.teacherForOrganization(
      dto.teacherId,
      item.organization.id,
    );
    const classBook = await this.classBookForSession(
      classroom,
      teacher,
      dto.classBookId,
    );
    Object.assign(item, {
      title: dto.title.trim(),
      weekday: dto.weekday,
      startTime: dto.startTime,
      endTime: dto.endTime,
      room: dto.room?.trim() || "",
      classroom,
      classBook,
      teacher,
    });
    return this.entries.save(item).then((entry) => this.publicEntry(entry));
  }
  async archive(
    user: AuthenticatedUser,
    id: string,
    dto: ArchiveScheduleEntryDto,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.archive");
    const item = await this.entries.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!item)
      throw new ApiException(404, "SCHEDULE_NOT_FOUND", "برنامه پیدا نشد.");
    if (
      !this.isOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(item.organization.id))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    if (item.versionId)
      throw new ApiException(
        409,
        "TIMETABLE_IMMUTABLE",
        "این درس را از نسخه برنامه درسی مدیریت کنید.",
      );
    item.status = dto.status;
    return this.entries.save(item).then((entry) => this.publicEntry(entry));
  }
  async remove(user: AuthenticatedUser, id: string) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.delete");
    const item = await this.entries.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!item)
      throw new ApiException(404, "SCHEDULE_NOT_FOUND", "برنامه پیدا نشد.");
    if (
      !this.isOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(item.organization.id))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    if (item.versionId)
      throw new ApiException(
        409,
        "TIMETABLE_IMMUTABLE",
        "این درس را از نسخه برنامه درسی مدیریت کنید.",
      );
    await this.entries.remove(item);
    return { deleted: true };
  }
  async previewImport(
    user: AuthenticatedUser,
    entries: SaveScheduleEntryDto[],
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.import");
    if (entries.length > 200)
      throw new ApiException(
        422,
        "SCHEDULE_IMPORT_LIMIT",
        "حداکثر ۲۰۰ ردیف مجاز است.",
      );
    const errors = entries.flatMap((item, index) =>
      this.importErrors(context, item).map((message) => ({
        row: index + 2,
        message,
      })),
    );
    return {
      valid: !errors.length,
      errors,
      summary: { rows: entries.length, valid: entries.length - errors.length },
    };
  }
  async commitImport(user: AuthenticatedUser, entries: SaveScheduleEntryDto[]) {
    const preview = await this.previewImport(user, entries);
    if (!preview.valid)
      throw new ApiException(
        422,
        "SCHEDULE_IMPORT_INVALID",
        "فایل برنامه معتبر نیست.",
        preview.errors,
      );
    return attendanceTransaction(this.entries.manager, async (manager) => {
      const saved = [];
      for (const entry of entries)
        saved.push(await this.create(user, entry, manager));
      const organizations = [...new Set(entries.map((e) => e.organizationId))];
      for (const organizationId of organizations)
        await manager.save(
          ImportHistory,
          manager.create(ImportHistory, {
            actor: { id: user.id },
            organization: { id: organizationId },
            schemaVersion: "school-schedule/1.0",
            counts: {
              lessons: entries.filter(
                (e) => e.organizationId === organizationId,
              ).length,
            },
            result: "SUCCESS",
            errors: null,
          }),
        );
      return { imported: saved.length, entries: saved };
    });
  }
  private importErrors(context: UserContext, item: SaveScheduleEntryDto) {
    const errors: string[] = [];
    if (
      !this.isOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(item.organizationId))
    )
      errors.push("مدرسه خارج از محدوده دسترسی است.");
    if (!item.title?.trim()) errors.push("عنوان لازم است.");
    if (!Number.isInteger(item.weekday) || item.weekday < 0 || item.weekday > 6)
      errors.push("روز هفته نامعتبر است.");
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime || "") ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime || "") ||
      item.endTime <= item.startTime
    )
      errors.push("بازه زمانی نامعتبر است.");
    return errors;
  }

  private async classroomForOrganization(
    classroomId: string | undefined,
    organizationId: string,
  ) {
    if (!classroomId) return null;
    const classroom = await this.classes.findOne({
      where: { id: classroomId, organization: { id: organizationId } },
    });
    if (!classroom)
      throw new ApiException(
        422,
        "SCHEDULE_CLASS_OUTSIDE_ORGANIZATION",
        "کلاس انتخاب‌شده متعلق به این مدرسه نیست.",
      );
    return classroom;
  }

  private publicEntry(entry: SchoolScheduleEntry) {
    // Identity entities are persistence objects, never public account DTOs.
    const teacher = (user?: User | null) =>
      user
        ? {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : null;
    return {
      ...entry,
      teacher: teacher(entry.teacher),
      classBook: entry.classBook
        ? { ...entry.classBook, teacher: teacher(entry.classBook.teacher) }
        : null,
    };
  }

  private async teacherForOrganization(
    teacherId: string | undefined,
    organizationId: string,
  ) {
    if (!teacherId) return null;
    const membership = await this.memberships.findOne({
      where: {
        user: { id: teacherId },
        organization: { id: organizationId },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: true },
    });
    if (!membership?.user)
      throw new ApiException(
        422,
        "SCHEDULE_TEACHER_OUTSIDE_ORGANIZATION",
        "استاد انتخاب‌شده عضو فعال این مدرسه نیست.",
      );
    return membership.user;
  }

  private async classBookForSession(
    classroom: EducationClass | null,
    teacher: User | null,
    classBookId: string | undefined,
  ) {
    if (!classroom) {
      if (classBookId)
        throw new ApiException(
          422,
          "SCHEDULE_BOOK_REQUIRES_CLASS",
          "کتاب جلسه باید به یک کلاس متصل باشد.",
        );
      return null;
    }
    if (!classBookId || !teacher)
      throw new ApiException(
        422,
        "SCHEDULE_CLASS_BOOK_REQUIRED",
        "برای جلسهٔ کلاسی، کتاب و استاد مسئول را انتخاب کنید.",
      );
    const classBook = await this.classBooks.findOne({
      where: {
        id: classBookId,
        classroom: { id: classroom.id },
        teacher: { id: teacher.id },
      },
      relations: { book: true, teacher: true },
    });
    if (!classBook)
      throw new ApiException(
        422,
        "SCHEDULE_BOOK_TEACHER_MISMATCH",
        "کتاب انتخاب‌شده به این کلاس و استاد واگذار نشده است.",
      );
    return classBook;
  }
}
