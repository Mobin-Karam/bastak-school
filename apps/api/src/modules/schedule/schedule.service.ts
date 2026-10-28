import { attendanceTransaction } from "../attendance";
import { ImportHistory } from "../../database/entities/import-history.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
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
import {
  SchoolAcademicYear,
  SchoolAcademicTerm,
} from "../../database/entities/school-academic-year.entity";
import { SchoolScheduleTimeBlock } from "../../database/entities/school-schedule-time-block.entity";
import { SchoolScheduleTimeBlockGroup } from "../../database/entities/school-schedule-time-block-group.entity";
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
import { TeacherLeaveRequest } from "../../database/entities/teacher-leave-request.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService, UserContext } from "../authorization";
import {
  ArchiveScheduleEntryDto,
  CreateScheduleTimeBlockDto,
  CreateScheduleTimeBlockGroupDto,
  CreateScheduleTemplateDto,
  SaveScheduleEntryDto,
  CreateLegacyAcademicYearDto,
  CreateLegacyAcademicTermDto,
  UpdateLegacyAcademicYearDto,
  UpdateLegacyAcademicTermDto,
  LegacyAcademicLifecycleDto,
  ScheduleSubstitutionDecisionDto,
  ScheduleSubstitutionRequestDto,
  TeacherLeaveRequestDto,
  TeacherLeaveReviewDto,
  TeacherLeaveReturnRequestDto,
  TeacherLeaveReturnReviewDto,
} from "./schedule.dto";

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(SchoolScheduleEntry)
    private readonly entries: Repository<SchoolScheduleEntry>,
    @InjectRepository(SchoolAcademicYear)
    private readonly academicYearRepo: Repository<SchoolAcademicYear>,
    @InjectRepository(SchoolAcademicTerm)
    private readonly academicTerms: Repository<SchoolAcademicTerm>,
    @InjectRepository(SchoolScheduleTimeBlock)
    private readonly timeBlocks: Repository<SchoolScheduleTimeBlock>,
    @InjectRepository(SchoolScheduleTimeBlockGroup)
    private readonly timeBlockGroups: Repository<SchoolScheduleTimeBlockGroup>,
    @InjectRepository(SchoolScheduleTemplate)
    private readonly templates: Repository<SchoolScheduleTemplate>,
    @InjectRepository(SchoolScheduleOccurrenceOverride)
    private readonly occurrenceOverrides: Repository<SchoolScheduleOccurrenceOverride>,
    @InjectRepository(SchoolScheduleSubstitutionRequest)
    private readonly substitutions: Repository<SchoolScheduleSubstitutionRequest>,
    @InjectRepository(TeacherLeaveRequest)
    private readonly teacherLeaves: Repository<TeacherLeaveRequest>,
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    @InjectRepository(EducationClass)
    private readonly classes: Repository<EducationClass>,
    @InjectRepository(EducationClassBook)
    private readonly classBooks: Repository<EducationClassBook>,
    private readonly authorization: AuthorizationService,
    @InjectRepository(AuditLog) private readonly auditLogs?: Repository<AuditLog>,
  ) {}
  private async auditAcademicCycle(
    user: AuthenticatedUser,
    organizationId: string,
    entity: "school_academic_year" | "school_academic_term",
    action: string,
    id: string,
    metadata: Record<string, unknown> = {},
  ) {
    if (!this.auditLogs) return;
    await this.auditLogs.save(
      this.auditLogs.create({
        user: { id: user.id } as User,
        organizationId,
        entity,
        action,
        metadata: { id, ...metadata },
      }),
    );
  }
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
      [
        "PLATFORM_ADMIN",
        "ORGANIZATION_ADMIN",
        "PRINCIPAL",
        "RELIGIOUS_EDUCATION_MANAGER",
      ].includes(role),
    );
  }
  private isPrincipalOperator(context: UserContext) {
    return context.roles.some((role) =>
      ["PLATFORM_ADMIN", "ORGANIZATION_ADMIN", "PRINCIPAL"].includes(role),
    );
  }
  private assertAcademicManager(context: UserContext) {
    if (!this.isOperator(context))
      throw new ApiException(
        403,
        "SCHEDULE_ACADEMIC_FORBIDDEN",
        "مدیریت سال و نیم‌سال فقط برای مدیر و مسئول آموزش دینی مجاز است.",
      );
  }
  private async scopedAcademicYear(user: AuthenticatedUser, id: string) {
    const context = this.context(user);
    this.assertAcademicManager(context);
    const year = await this.academicYearRepo.findOneBy({ id });
    if (
      !year ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(year.organizationId))
    )
      throw new ApiException(
        404,
        "SCHEDULE_ACADEMIC_YEAR_NOT_FOUND",
        "سال تحصیلی پیدا نشد.",
      );
    return year;
  }
  async academicYears(user: AuthenticatedUser, organizationId?: string) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.read");
    const org = organizationId ?? context.organizationIds[0];
    if (
      !org ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(org))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const years = await this.academicYearRepo.find({
      where: { organizationId: org },
      order: { startsOn: "DESC" },
    });
    const terms = years.length
      ? await this.academicTerms.find({
          where: { academicYearId: In(years.map((year) => year.id)) },
          order: { startsOn: "ASC" },
        })
      : [];
    return { years, terms };
  }
  async createAcademicYear(
    user: AuthenticatedUser,
    dto: CreateLegacyAcademicYearDto,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.create");
    this.assertAcademicManager(context);
    if (dto.endsOn < dto.startsOn)
      throw new ApiException(
        422,
        "SCHEDULE_ACADEMIC_DATE",
        "بازه سال تحصیلی معتبر نیست.",
      );
    if (
      !context.roles.includes("PLATFORM_ADMIN") &&
      !context.organizationIds.includes(dto.organizationId)
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const row = await this.academicYearRepo.save(
      this.academicYearRepo.create({
        organizationId: dto.organizationId,
        name: dto.name.trim(),
        startsOn: dto.startsOn,
        endsOn: dto.endsOn,
        state: "DRAFT",
      }),
    );
    await this.auditAcademicCycle(user, row.organizationId, "school_academic_year", "created", row.id);
    return row;
  }
  async createAcademicTerm(
    user: AuthenticatedUser,
    dto: CreateLegacyAcademicTermDto,
  ) {
    const year = await this.scopedAcademicYear(user, dto.academicYearId);
    if (
      year.state === "ARCHIVED" ||
      dto.startsOn < year.startsOn ||
      dto.endsOn > year.endsOn ||
      dto.endsOn < dto.startsOn
    )
      throw new ApiException(
        422,
        "SCHEDULE_ACADEMIC_DATE",
        "بازه نیم‌سال باید داخل سال و معتبر باشد.",
      );
    const overlap = await this.academicTerms
      .createQueryBuilder("term")
      .where("term.academicYearId = :year", { year: year.id })
      .andWhere("term.startsOn <= :end AND term.endsOn >= :start", {
        start: dto.startsOn,
        end: dto.endsOn,
      })
      .getExists();
    if (overlap)
      throw new ApiException(
        409,
        "SCHEDULE_ACADEMIC_TERM_OVERLAP",
        "نیم‌سال‌ها نباید هم‌پوشانی داشته باشند.",
      );
    const row = await this.academicTerms.save(
      this.academicTerms.create({
        academicYearId: year.id,
        name: dto.name.trim(),
        startsOn: dto.startsOn,
        endsOn: dto.endsOn,
        state: "DRAFT",
      }),
    );
    await this.auditAcademicCycle(user, year.organizationId, "school_academic_term", "created", row.id, {
      academicYearId: year.id,
    });
    return row;
  }
  async updateAcademicYear(user: AuthenticatedUser, id: string, dto: UpdateLegacyAcademicYearDto) {
    const year = await this.scopedAcademicYear(user, id);
    if (year.state === "ARCHIVED" || dto.endsOn < dto.startsOn)
      throw new ApiException(422, "SCHEDULE_ACADEMIC_DATE", "سال تحصیلی قابل ویرایش نیست یا بازه معتبر نیست.");
    const terms = await this.academicTerms.findBy({ academicYearId: year.id });
    if (terms.some((term) => term.startsOn < dto.startsOn || term.endsOn > dto.endsOn))
      throw new ApiException(422, "SCHEDULE_ACADEMIC_DATE", "بازهٔ جدید سال باید همه نیم‌سال‌ها را در بر بگیرد.");
    const previous = { name: year.name, startsOn: year.startsOn, endsOn: year.endsOn };
    year.name = dto.name.trim();
    year.startsOn = dto.startsOn;
    year.endsOn = dto.endsOn;
    const row = await this.academicYearRepo.save(year);
    await this.auditAcademicCycle(user, row.organizationId, "school_academic_year", "updated", row.id, {
      previous,
      next: { name: row.name, startsOn: row.startsOn, endsOn: row.endsOn },
    });
    return row;
  }
  async updateAcademicTerm(user: AuthenticatedUser, id: string, dto: UpdateLegacyAcademicTermDto) {
    const term = await this.academicTerms.findOneBy({ id });
    if (!term)
      throw new ApiException(404, "SCHEDULE_ACADEMIC_TERM_NOT_FOUND", "نیم‌سال پیدا نشد.");
    const year = await this.scopedAcademicYear(user, term.academicYearId);
    if (
      (term.state === "ARCHIVED" && !term.correctionOpen) ||
      dto.endsOn < dto.startsOn ||
      dto.startsOn < year.startsOn ||
      dto.endsOn > year.endsOn
    )
      throw new ApiException(422, "SCHEDULE_ACADEMIC_DATE", "نیم‌سال قابل ویرایش نیست یا بازه معتبر نیست.");
    const overlap = await this.academicTerms
      .createQueryBuilder("term")
      .where("term.academicYearId = :year AND term.id != :id", { year: year.id, id })
      .andWhere("term.startsOn <= :end AND term.endsOn >= :start", {
        start: dto.startsOn,
        end: dto.endsOn,
      })
      .getExists();
    if (overlap)
      throw new ApiException(409, "SCHEDULE_ACADEMIC_TERM_OVERLAP", "نیم‌سال‌ها نباید هم‌پوشانی داشته باشند.");
    const previous = { name: term.name, startsOn: term.startsOn, endsOn: term.endsOn };
    term.name = dto.name.trim();
    term.startsOn = dto.startsOn;
    term.endsOn = dto.endsOn;
    const row = await this.academicTerms.save(term);
    await this.auditAcademicCycle(user, year.organizationId, "school_academic_term", "updated", row.id, {
      academicYearId: year.id,
      previous,
      next: { name: row.name, startsOn: row.startsOn, endsOn: row.endsOn },
    });
    return row;
  }
  async academicYearLifecycle(
    user: AuthenticatedUser,
    id: string,
    dto: LegacyAcademicLifecycleDto,
  ) {
    const year = await this.scopedAcademicYear(user, id);
    if (dto.action === "activate") {
      const terms = await this.academicTerms.findBy({
        academicYearId: year.id,
      });
      if (terms.length < 2)
        throw new ApiException(
          409,
          "SCHEDULE_ACADEMIC_TERMS_REQUIRED",
          "فعال‌سازی سال حداقل به دو نیم‌سال نیاز دارد.",
        );
      await this.academicYearRepo.update(
        { organizationId: year.organizationId, state: "ACTIVE" },
        { state: "ARCHIVED" },
      );
      year.state = "ACTIVE";
      await this.academicYearRepo.save(year);
      await this.academicTerms.update(
        { academicYearId: year.id, state: "DRAFT" },
        { state: "ACTIVE" },
      );
    } else if (dto.action === "archive") {
      year.state = "ARCHIVED";
      await this.academicYearRepo.save(year);
      await this.academicTerms.update(
        { academicYearId: year.id },
        { state: "ARCHIVED", correctionOpen: false },
      );
    } else
      throw new ApiException(
        422,
        "SCHEDULE_ACADEMIC_LIFECYCLE",
        "عملیات سال تحصیلی معتبر نیست.",
      );
    await this.auditAcademicCycle(user, year.organizationId, "school_academic_year", dto.action, year.id, {
      state: year.state,
    });
    return year;
  }
  async academicTermLifecycle(
    user: AuthenticatedUser,
    id: string,
    dto: LegacyAcademicLifecycleDto,
  ) {
    const term = await this.academicTerms.findOneBy({ id });
    if (!term)
      throw new ApiException(
        404,
        "SCHEDULE_ACADEMIC_TERM_NOT_FOUND",
        "نیم‌سال پیدا نشد.",
      );
    await this.scopedAcademicYear(user, term.academicYearId);
    if (dto.action === "archive") {
      term.state = "ARCHIVED";
      term.correctionOpen = false;
    } else if (dto.action === "reopen" && term.state === "ARCHIVED")
      term.correctionOpen = true;
    else if (dto.action === "close-correction" && term.correctionOpen)
      term.correctionOpen = false;
    else
      throw new ApiException(
        422,
        "SCHEDULE_ACADEMIC_LIFECYCLE",
        "عملیات نیم‌سال معتبر نیست.",
      );
    const row = await this.academicTerms.save(term);
    const year = await this.academicYearRepo.findOneByOrFail({ id: row.academicYearId });
    await this.auditAcademicCycle(user, year.organizationId, "school_academic_term", dto.action, row.id, {
      academicYearId: year.id,
      state: row.state,
      correctionOpen: row.correctionOpen,
    });
    return row;
  }
  async academicYearHistory(user: AuthenticatedUser, id: string) {
    const year = await this.scopedAcademicYear(user, id);
    if (!this.auditLogs) return [];
    const rows = await this.auditLogs.find({
      where: { organizationId: year.organizationId, entity: "school_academic_year" },
      order: { createdAt: "DESC" },
      take: 100,
    });
    return rows.filter((row) => row.metadata?.id === id);
  }
  async academicTermHistory(user: AuthenticatedUser, id: string) {
    const term = await this.academicTerms.findOneBy({ id });
    if (!term)
      throw new ApiException(404, "SCHEDULE_ACADEMIC_TERM_NOT_FOUND", "نیم‌سال پیدا نشد.");
    const year = await this.scopedAcademicYear(user, term.academicYearId);
    if (!this.auditLogs) return [];
    const rows = await this.auditLogs.find({
      where: { organizationId: year.organizationId, entity: "school_academic_term" },
      order: { createdAt: "DESC" },
      take: 100,
    });
    return rows.filter((row) => row.metadata?.id === id);
  }
  private async assertLegacyScheduleWritable(entry: SchoolScheduleEntry) {
    if (!entry.academicYearId && !entry.termId) return;
    const year = entry.academicYearId
      ? await this.academicYearRepo.findOneBy({ id: entry.academicYearId })
      : null;
    const term = entry.academicYearId && entry.termId
      ? await this.academicTerms.findOneBy({
          id: entry.termId,
          academicYearId: entry.academicYearId,
        })
      : null;
    if (!year || !term || year.state === "ARCHIVED" || term.state === "ARCHIVED")
      throw new ApiException(
        409,
        "SCHEDULE_ACADEMIC_TERM_LOCKED",
        "برنامهٔ نیم‌سال بایگانی‌شده فقط خواندنی است؛ بازگشایی تاریخی فقط برای اصلاح حضور و غیاب است.",
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
  private publicTeacherLeave(row: TeacherLeaveRequest) {
    const person = (user?: User | null) =>
      user
        ? {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : null;
    return {
      id: row.id,
      organizationId: row.organizationId,
      teacherId: row.teacherId,
      startDate: row.startDate,
      endDate: row.endDate,
      reason: row.reason,
      academicCycleSnapshots: row.academicCycleSnapshots ?? [],
      status: row.status,
      resolution: row.resolution,
      substituteTeacherId: row.substituteTeacherId,
      reviewedById: row.reviewedById,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      returnDate: row.returnDate,
      returnMessage: row.returnMessage,
      returnStatus: row.returnStatus,
      returnRequestedAt: row.returnRequestedAt?.toISOString() ?? null,
      returnReviewedAt: row.returnReviewedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      teacher: person(row.teacher),
      substituteTeacher: person(row.substituteTeacher),
    };
  }
  async teacherLeaveRequests(user: AuthenticatedUser) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.read");
    const reviewer =
      this.isPrincipalOperator(context) &&
      user.capabilities?.includes("schedule.publish");
    const rows = await this.teacherLeaves.find({
      where: reviewer
        ? { organizationId: In(context.organizationIds) }
        : { teacherId: user.id, organizationId: In(context.organizationIds) },
      relations: { teacher: true, substituteTeacher: true },
      order: { createdAt: "DESC" },
    });
    return rows.map((row) => this.publicTeacherLeave(row));
  }
  async requestTeacherLeave(
    user: AuthenticatedUser,
    dto: TeacherLeaveRequestDto,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "attendance.class.manage");
    if (
      !this.dateIsValid(dto.startDate) ||
      !this.dateIsValid(dto.endDate) ||
      dto.endDate < dto.startDate
    )
      throw new ApiException(
        422,
        "TEACHER_LEAVE_DATE_INVALID",
        "بازه مرخصی معتبر نیست.",
      );
    if (
      !context.organizationIds.includes(dto.organizationId) &&
      !context.roles.includes("PLATFORM_ADMIN")
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const cycleSnapshots = await this.teacherLeaveCycleSnapshots(
      dto.organizationId,
      user.id,
    );
    const row = await this.teacherLeaves.save(
      this.teacherLeaves.create({
        organizationId: dto.organizationId,
        teacherId: user.id,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason.trim(),
        academicCycleSnapshots: cycleSnapshots,
        status: "pending",
        resolution: null,
        substituteTeacherId: null,
        reviewedById: null,
        reviewedAt: null,
        returnDate: null,
        returnMessage: null,
        returnStatus: null,
        returnRequestedAt: null,
        returnReviewedAt: null,
      }),
    );
    return this.publicTeacherLeave({
      ...row,
      teacher: { id: user.id } as User,
    });
  }
  private async teacherLeaveCycleSnapshots(
    organizationId: string,
    teacherId: string,
  ) {
    const entries = await this.entries.find({
      where: {
        organization: { id: organizationId },
        versionId: IsNull(),
        status: "ACTIVE",
      },
      relations: { teacher: true, classBook: { teacher: true } },
    });
    const affected = entries.filter(
      (entry) =>
        (entry.teacher?.id === teacherId || entry.classBook?.teacher?.id === teacherId) &&
        entry.academicYearId &&
        entry.termId,
    );
    const yearIds = [...new Set(affected.map((entry) => entry.academicYearId!))];
    const years = yearIds.length
      ? await this.academicYearRepo.findBy({ id: In(yearIds) })
      : [];
    const yearNames = new Map(years.map((year) => [year.id, year.name]));
    const termIds = [...new Set(affected.map((entry) => entry.termId!))];
    const terms = termIds.length
      ? await this.academicTerms.findBy({ id: In(termIds) })
      : [];
    const termNames = new Map(terms.map((term) => [term.id, term.name]));
    return [...new Map(
      affected.map((entry) => {
        const value = {
          academicYearId: entry.academicYearId!,
          academicYearName: entry.academicYearNameSnapshot ?? yearNames.get(entry.academicYearId!) ?? null,
          termId: entry.termId!,
          termName: entry.termNameSnapshot ?? termNames.get(entry.termId!) ?? null,
        };
        return [`${value.academicYearId}:${value.termId}`, value] as const;
      }),
    ).values()];
  }
  async reviewTeacherLeave(
    user: AuthenticatedUser,
    id: string,
    dto: TeacherLeaveReviewDto,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.publish");
    const row = await this.teacherLeaves.findOne({
      where: { id },
      relations: { teacher: true, substituteTeacher: true },
    });
    if (!row || row.status !== "pending")
      throw new ApiException(
        404,
        "TEACHER_LEAVE_NOT_FOUND",
        "درخواست مرخصی در انتظار بررسی پیدا نشد.",
      );
    if (
      !this.isPrincipalOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(row.organizationId))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    if (
      dto.decision === "approved" &&
      (!dto.resolution ||
        (dto.resolution === "substitute" && !dto.substituteTeacherId))
    )
      throw new ApiException(
        422,
        "TEACHER_LEAVE_RESOLUTION_REQUIRED",
        "برای تأیید، لغو جلسه یا دبیر جایگزین را انتخاب کنید.",
      );
    const substitute =
      dto.resolution === "substitute"
        ? await this.teacherForOrganization(
            dto.substituteTeacherId,
            row.organizationId,
          )
        : null;
    if (dto.resolution === "substitute" && !substitute)
      throw new ApiException(
        422,
        "TEACHER_SUBSTITUTE_INVALID",
        "دبیر جایگزین معتبر نیست.",
      );
    if (substitute?.id === row.teacherId)
      throw new ApiException(
        422,
        "TEACHER_SUBSTITUTE_INVALID",
        "دبیر جایگزین باید فرد دیگری باشد.",
      );
    row.status = dto.decision;
    row.resolution =
      dto.decision === "approved" ? (dto.resolution ?? null) : null;
    row.substituteTeacherId = substitute?.id ?? null;
    row.substituteTeacher = substitute;
    row.reviewedById = user.id;
    row.reviewedAt = new Date();
    if (dto.decision === "approved")
      await this.applyTeacherLeave(row, user.id, substitute);
    return this.publicTeacherLeave(await this.teacherLeaves.save(row));
  }
  async requestTeacherLeaveReturn(
    user: AuthenticatedUser,
    id: string,
    dto: TeacherLeaveReturnRequestDto,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "attendance.class.manage");
    const row = await this.teacherLeaves.findOneBy({ id });
    if (!row || row.teacherId !== user.id || row.status !== "approved")
      throw new ApiException(
        404,
        "TEACHER_LEAVE_NOT_FOUND",
        "مرخصی تأییدشده پیدا نشد.",
      );
    if (
      !this.dateIsValid(dto.returnDate) ||
      dto.returnDate < row.startDate ||
      dto.returnDate > row.endDate
    )
      throw new ApiException(
        422,
        "TEACHER_LEAVE_RETURN_DATE_INVALID",
        "تاریخ بازگشت باید در بازه مرخصی باشد.",
      );
    if (row.returnStatus === "approved")
      throw new ApiException(
        409,
        "TEACHER_LEAVE_RETURN_ALREADY_APPROVED",
        "بازگشت این مرخصی پیش‌تر تأیید شده است.",
      );
    row.returnDate = dto.returnDate;
    row.returnMessage = dto.returnMessage?.trim() || null;
    row.returnStatus = "pending";
    row.returnRequestedAt = new Date();
    row.returnReviewedAt = null;
    return this.publicTeacherLeave(await this.teacherLeaves.save(row));
  }
  async reviewTeacherLeaveReturn(
    user: AuthenticatedUser,
    id: string,
    dto: TeacherLeaveReturnReviewDto,
  ) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.publish");
    const row = await this.teacherLeaves.findOne({
      where: { id },
      relations: { teacher: true, substituteTeacher: true },
    });
    if (
      !row ||
      row.status !== "approved" ||
      row.returnStatus !== "pending" ||
      !row.returnDate
    )
      throw new ApiException(
        404,
        "TEACHER_LEAVE_RETURN_NOT_FOUND",
        "درخواست بازگشت در انتظار بررسی پیدا نشد.",
      );
    if (
      !this.isPrincipalOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(row.organizationId))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    row.returnStatus = dto.decision;
    row.returnReviewedAt = new Date();
    if (dto.decision === "approved") await this.restoreTeacherLeave(row);
    return this.publicTeacherLeave(await this.teacherLeaves.save(row));
  }
  private async applyTeacherLeave(
    row: TeacherLeaveRequest,
    changedById: string,
    substitute: User | null,
  ) {
    const entries = await this.entries.find({
      where: {
        organization: { id: row.organizationId },
        versionId: IsNull(),
        status: "ACTIVE",
      },
      relations: {
        organization: true,
        classroom: true,
        classBook: { teacher: true },
        teacher: true,
      },
    });
    const affected = entries.filter(
      (entry) =>
        entry.teacher?.id === row.teacherId ||
        entry.classBook?.teacher?.id === row.teacherId,
    );
    for (let date = row.startDate; date <= row.endDate;) {
      const next = new Date(`${date}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      for (const entry of affected.filter(
        (item) =>
          item.weekday === this.weekdayForDate(date) &&
          (!item.startsOn || item.startsOn <= date) &&
          (!item.endsOn || item.endsOn >= date),
      )) {
        const override = await this.occurrenceOverrides.findOneBy({
          entryId: entry.id,
          date,
        });
        if (override) continue;
        await this.occurrenceOverrides.save(
          this.occurrenceOverrides.create({
            entryId: entry.id,
            date,
            cancelled: true,
            leaveRequestId: row.id,
            changedById,
          }),
        );
        if (substitute)
          await this.entries.save(
            this.entries.create({
              ...entry,
              id: undefined,
              teacher: substitute,
              status: "REPLACED",
              weekday: entry.weekday,
              startsOn: date,
              endsOn: date,
              notes: `جایگزین مرخصی ${row.id}`,
              teacherNameSnapshot:
                `${substitute.firstName ?? ""} ${substitute.lastName ?? ""}`.trim(),
            }),
          );
      }
      date = next.toISOString().slice(0, 10);
    }
  }
  private async restoreTeacherLeave(row: TeacherLeaveRequest) {
    const restoredFrom = row.returnDate!;
    const overrides = await this.occurrenceOverrides.find({
      where: { leaveRequestId: row.id },
    });
    await this.occurrenceOverrides.remove(
      overrides.filter((override) => override.date >= restoredFrom),
    );
    const replacements = await this.entries.find({
      where: { organization: { id: row.organizationId } },
    });
    await this.entries.save(
      replacements
        .filter(
          (entry) =>
            entry.notes === `جایگزین مرخصی ${row.id}` &&
            (entry.startsOn ?? "") >= restoredFrom,
        )
        .map((entry) => ({ ...entry, status: "ARCHIVED" as const })),
    );
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
  async scheduleCancellations(user: AuthenticatedUser, date: string) {
    if (!this.dateIsValid(date))
      throw new ApiException(
        422,
        "SCHEDULE_DATE_INVALID",
        "تاریخ جلسه معتبر نیست.",
      );
    const entries = await this.listEntities(user);
    const overrides = await this.occurrenceOverrides.find({
      where: { date, cancelled: true },
    });
    const visible = new Set(entries.map((entry) => entry.id));
    return overrides
      .filter((row) => visible.has(row.entryId))
      .map((row) => ({
        entryId: row.entryId,
        date,
        message: "این جلسه به‌دلیل مرخصی دبیر برگزار نمی‌شود.",
      }));
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
            academicYearId: source.academicYearId,
            termId: source.termId,
            academicYearNameSnapshot: source.academicYearNameSnapshot,
            termNameSnapshot: source.termNameSnapshot,
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
            academicYearId: target.academicYearId,
            termId: target.termId,
            academicYearNameSnapshot: target.academicYearNameSnapshot,
            termNameSnapshot: target.termNameSnapshot,
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
  async list(
    user: AuthenticatedUser,
    organizationId?: string,
    academicYearId?: string,
    termId?: string,
  ) {
    return (await this.listEntities(user, organizationId))
      .filter(
        (entry) =>
          (!academicYearId || entry.academicYearId === academicYearId) &&
          (!termId || entry.termId === termId),
      )
      .map((entry) =>
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
        where: [
          {
            versionId: IsNull(),
            teacher: { id: user.id },
            organization: {
              id: In(
                requestedOrganizationId
                  ? [requestedOrganizationId]
                  : context.organizationIds,
              ),
            },
            status: In(["ACTIVE", "REPLACED"]),
          },
          {
            versionId: IsNull(),
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
        ],
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
        relations: { organization: true, group: true },
        order: { group: { name: "ASC" }, startTime: "ASC", name: "ASC" },
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
      relations: { organization: true, group: true },
      order: { group: { name: "ASC" }, startTime: "ASC", name: "ASC" },
    });
  }
  async listTimeBlockGroups(user: AuthenticatedUser, organizationId?: string) {
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
      return this.timeBlockGroups.find({
        where: requestedOrganizationId
          ? { organization: { id: requestedOrganizationId } }
          : {},
        relations: { organization: true },
        order: { name: "ASC" },
      });
    if (!context.organizationIds.length) return [];
    return this.timeBlockGroups.find({
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
    const group = await this.timeBlockGroups.findOne({
      where: { id: dto.groupId },
      relations: { organization: true },
    });
    if (!group || group.organization.id !== organization.id)
      throw new ApiException(
        422,
        "TIME_BLOCK_GROUP_INVALID",
        "گروه بازه زمانی برای این مدرسه معتبر نیست.",
      );
    const existing = await this.timeBlocks.findOne({
      where: {
        organization: { id: organization.id },
        group: { id: group.id },
        name,
      },
    });
    if (existing)
      throw new ApiException(
        409,
        "TIME_BLOCK_NAME_EXISTS",
        "این نام بازه زمانی در همین گروه قبلاً ثبت شده است.",
      );
    return this.timeBlocks.save(
      this.timeBlocks.create({
        name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        partOfDay: dto.startTime < "12:00" ? "AM" : "PM",
        organization,
        group,
      }),
    );
  }
  async createTimeBlockGroup(
    user: AuthenticatedUser,
    dto: CreateScheduleTimeBlockGroupDto,
  ) {
    const organization = await this.templateScope(
      user,
      dto.organizationId,
      "schedule.update",
    );
    const name = dto.name.trim();
    if (!name)
      throw new ApiException(
        422,
        "TIME_BLOCK_GROUP_NAME_REQUIRED",
        "نام گروه لازم است.",
      );
    const existing = await this.timeBlockGroups.findOne({
      where: { organization: { id: organization.id }, name },
    });
    if (existing)
      throw new ApiException(
        409,
        "TIME_BLOCK_GROUP_NAME_EXISTS",
        "این گروه قبلاً ثبت شده است.",
      );
    return this.timeBlockGroups.save(
      this.timeBlockGroups.create({ organization, name }),
    );
  }
  async removeTimeBlockGroup(user: AuthenticatedUser, id: string) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.update");
    const group = await this.timeBlockGroups.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!group)
      throw new ApiException(
        404,
        "TIME_BLOCK_GROUP_NOT_FOUND",
        "گروه بازه زمانی پیدا نشد.",
      );
    if (
      !this.isOperator(context) ||
      (!context.roles.includes("PLATFORM_ADMIN") &&
        !context.organizationIds.includes(group.organization.id))
    )
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    const hasBlocks = await this.timeBlocks.exist({
      where: { group: { id: group.id } },
    });
    if (hasBlocks)
      throw new ApiException(
        409,
        "TIME_BLOCK_GROUP_NOT_EMPTY",
        "ابتدا بازه‌های این گروه را حذف یا به گروه دیگری منتقل کنید.",
      );
    await this.timeBlockGroups.remove(group);
    return { deleted: true };
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
    const activeYear = await this.academicYearRepo.findOneBy({
      organizationId: organization.id,
      state: "ACTIVE",
    });
    if (activeYear && (!dto.academicYearId || !dto.termId))
      throw new ApiException(
        422,
        "SCHEDULE_ACADEMIC_TERM_REQUIRED",
        "برای سال فعال، سال و نیم‌سال جلسه را انتخاب کنید.",
      );
    let academicYear: SchoolAcademicYear | null = null;
    let academicTerm: SchoolAcademicTerm | null = null;
    if (dto.academicYearId || dto.termId) {
      academicTerm =
        dto.academicYearId && dto.termId
          ? await this.academicTerms.findOneBy({
              id: dto.termId,
              academicYearId: dto.academicYearId,
            })
          : null;
      academicYear = dto.academicYearId
        ? await this.academicYearRepo.findOneBy({
            id: dto.academicYearId,
            organizationId: organization.id,
          })
        : null;
      if (
        !academicYear ||
        !academicTerm ||
        academicYear.state === "ARCHIVED" ||
        academicTerm.state === "ARCHIVED" ||
        academicTerm.correctionOpen
      )
        throw new ApiException(
          409,
          "SCHEDULE_ACADEMIC_TERM_LOCKED",
          "سال یا نیم‌سال انتخاب‌شده برای جلسه جدید قابل استفاده نیست.",
        );
    }
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
          academicYearId: dto.academicYearId ?? null,
          termId: dto.termId ?? null,
          academicYearNameSnapshot: academicYear?.name ?? null,
          termNameSnapshot: academicTerm?.name ?? null,
        }),
      )
      .then((entry) => this.publicEntry(entry));
  }
  async createMany(user: AuthenticatedUser, entries: SaveScheduleEntryDto[]) {
    if (!entries.length || entries.length > 28)
      throw new ApiException(
        422,
        "SCHEDULE_BATCH_INVALID",
        "تعداد جلسه‌ها معتبر نیست.",
      );
    return attendanceTransaction(this.entries.manager, (manager) =>
      Promise.all(entries.map((entry) => this.create(user, entry, manager))),
    );
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
    await this.assertLegacyScheduleWritable(item);
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
    await this.assertLegacyScheduleWritable(item);
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
    await this.assertLegacyScheduleWritable(item);
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
