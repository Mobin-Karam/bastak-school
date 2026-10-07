import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { Organization } from "../../database/entities/organization.entity";
import { SchoolScheduleEntry } from "../../database/entities/school-schedule-entry.entity";
import { User } from "../../database/entities/user.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService, UserContext } from "../authorization";
import { ArchiveScheduleEntryDto, SaveScheduleEntryDto } from "./schedule.dto";

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(SchoolScheduleEntry)
    private readonly entries: Repository<SchoolScheduleEntry>,
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(EducationClass)
    private readonly classes: Repository<EducationClass>,
    @InjectRepository(User) private readonly users: Repository<User>,
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
  async list(user: AuthenticatedUser, organizationId?: string) {
    const context = this.context(user);
    this.authorization.requireCapability(context, "schedule.read");
    if (context.roles.includes("PLATFORM_ADMIN"))
      return this.entries.find({
        where: organizationId ? { organization: { id: organizationId } } : {},
        relations: { organization: true, classroom: true, teacher: true },
        order: { weekday: "ASC", startTime: "ASC" },
      });
    if (this.isOperator(context))
      return this.entries.find({
        where: {
          organization: {
            id: In(organizationId ? [organizationId] : context.organizationIds),
          },
        },
        relations: { organization: true, classroom: true, teacher: true },
        order: { weekday: "ASC", startTime: "ASC" },
      });
    if (context.roles.includes("TEACHER"))
      return this.entries.find({
        where: { teacher: { id: user.id }, status: "ACTIVE" },
        relations: { organization: true, classroom: true, teacher: true },
        order: { weekday: "ASC", startTime: "ASC" },
      });
    if (
      context.roles.some((role) =>
        ["ADVISOR", "MENTOR", "COUNSELOR", "STUDENT_AFFAIRS_MENTOR"].includes(
          role,
        ),
      )
    ) {
      return this.entries.find({
        where: { classroom: { advisor: { id: user.id } }, status: "ACTIVE" },
        relations: {
          organization: true,
          classroom: { advisor: true },
          teacher: true,
        },
        order: { weekday: "ASC", startTime: "ASC" },
      });
    }
    if (context.roles.includes("GUARDIAN")) {
      return this.entries
        .createQueryBuilder("entry")
        .leftJoinAndSelect("entry.organization", "organization")
        .leftJoinAndSelect("entry.classroom", "classroom")
        .leftJoinAndSelect("entry.teacher", "teacher")
        .leftJoin(
          EducationClassEnrollment,
          "enrollment",
          "enrollment.classroomId = entry.classroomId",
        )
        .leftJoin(
          UserRelationship,
          "relationship",
          "relationship.toStudentId = enrollment.studentId AND relationship.fromUserId = :userId AND relationship.status = 'ACTIVE' AND relationship.type = 'GUARDIAN_OF'",
          { userId: user.id },
        )
        .where("entry.status = 'ACTIVE'")
        .andWhere("entry.classroomId IS NULL OR relationship.id IS NOT NULL")
        .orderBy("entry.weekday", "ASC")
        .addOrderBy("entry.startTime", "ASC")
        .getMany();
    }
    if (context.roles.includes("STUDENT")) {
      return this.entries
        .createQueryBuilder("entry")
        .leftJoinAndSelect("entry.organization", "organization")
        .leftJoinAndSelect("entry.classroom", "classroom")
        .leftJoinAndSelect("entry.teacher", "teacher")
        .leftJoin(
          EducationClassEnrollment,
          "enrollment",
          "enrollment.classroomId = entry.classroomId AND enrollment.studentId = (SELECT id FROM students WHERE userId = :userId LIMIT 1)",
          { userId: user.id },
        )
        .where("entry.status = 'ACTIVE'")
        .andWhere("entry.classroomId IS NULL OR enrollment.id IS NOT NULL")
        .orderBy("entry.weekday", "ASC")
        .addOrderBy("entry.startTime", "ASC")
        .getMany();
    }
    if (context.organizationIds.length) {
      return this.entries.find({
        where: {
          organization: {
            id: In(organizationId ? [organizationId] : context.organizationIds),
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
  async create(user: AuthenticatedUser, dto: SaveScheduleEntryDto) {
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
    const classroom = dto.classroomId
      ? await this.classes.findOneBy({ id: dto.classroomId })
      : null;
    const teacher = dto.teacherId
      ? await this.users.findOneBy({ id: dto.teacherId })
      : null;
    if (dto.endTime <= dto.startTime)
      throw new ApiException(
        422,
        "INVALID_TIME_RANGE",
        "زمان پایان باید بعد از شروع باشد.",
      );
    return this.entries.save(
      this.entries.create({
        ...dto,
        room: dto.room?.trim() || "",
        organization,
        classroom,
        teacher,
      }),
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
    const classroom = dto.classroomId
      ? await this.classes.findOneBy({ id: dto.classroomId })
      : null;
    const teacher = dto.teacherId
      ? await this.users.findOneBy({ id: dto.teacherId })
      : null;
    Object.assign(item, {
      title: dto.title.trim(),
      weekday: dto.weekday,
      startTime: dto.startTime,
      endTime: dto.endTime,
      room: dto.room?.trim() || "",
      classroom,
      teacher,
    });
    return this.entries.save(item);
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
    item.status = dto.status;
    return this.entries.save(item);
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
    const saved = [];
    for (const entry of entries) saved.push(await this.create(user, entry));
    return { imported: saved.length, entries: saved };
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
}
