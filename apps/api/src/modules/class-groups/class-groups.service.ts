import type { ClassGroupSummary } from "@moshaver/api-contract";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { Student } from "../../database/entities/student.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import {
  CreateClassGroupDto,
  UpdateClassGroupDto,
  MAX_CLASS_GROUP_MEMBERS,
} from "./class-groups.dto";

@Injectable()
export class ClassGroupsService {
  constructor(
    @InjectRepository(EducationClass)
    private readonly classes: Repository<EducationClass>,
    @InjectRepository(EducationClassEnrollment)
    private readonly enrollments: Repository<EducationClassEnrollment>,
    @InjectRepository(StudyGroup)
    private readonly groups: Repository<StudyGroup>,
    @InjectRepository(StudyGroupMembership)
    private readonly memberships: Repository<StudyGroupMembership>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    private readonly access: SchoolAccessService,
  ) {}

  async classOptions(user: AuthenticatedUser, organizationId?: string) {
    this.requireCapability(user, "class_groups.read");
    if (organizationId) this.assertWorkOrganization(user, organizationId);
    const organizationIds = await this.access.scopedOrganizationIds(
      user,
      organizationId ?? user.activeOrganizationId,
    );
    if (!organizationIds.length) return [];
    const classrooms = await this.classes.find({
      where: { organization: { id: In(organizationIds) } },
      relations: {
        organization: true,
        advisor: true,
        books: { teacher: true },
        enrollments: true,
      },
      order: { name: "ASC" },
    });
    return classrooms
      .filter((classroom) => this.canReadGroup(user, { classroom }))
      .map((classroom) => ({
        id: classroom.id,
        code: classroom.code,
        name: classroom.name,
        status: classroom.status,
        organizationId: classroom.organization.id,
        organizationName: classroom.organization.name,
        enrollmentCount: classroom.enrollments.length,
      }));
  }
  async eligibleStudents(user: AuthenticatedUser, classId: string) {
    this.requireCapability(user, "class_groups.read");
    const classroom = await this.classes.findOne({
      where: { id: classId },
      relations: {
        organization: true,
        advisor: true,
        books: { teacher: true },
      },
    });
    if (!classroom)
      throw new ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
    await this.access.organizationForUser(user, classroom.organization.id);
    this.assertWorkOrganization(user, classroom.organization.id);
    if (!this.canReadGroup(user, { classroom }))
      throw new ApiException(
        403,
        "CLASS_GROUP_FORBIDDEN",
        "این کلاس به شما واگذار نشده است.",
      );
    const enrolled = await this.enrollments.find({
      where: { classroom: { id: classroom.id } },
      relations: { student: { organization: true } },
      order: { student: { name: "ASC" } },
    });
    return enrolled
      .filter(
        (row) => row.student.organization?.id === classroom.organization.id,
      )
      .map((row) => ({
        id: row.student.id,
        name: row.student.name,
        grade: row.student.grade,
        major: row.student.major,
      }));
  }
  async list(
    user: AuthenticatedUser,
    classId?: string,
    organizationId?: string,
  ) {
    this.requireCapability(user, "class_groups.read");
    if (organizationId) this.assertWorkOrganization(user, organizationId);
    const organizationIds = await this.access.scopedOrganizationIds(
      user,
      organizationId ?? user.activeOrganizationId,
    );
    if (!organizationIds.length) return [];
    const rows = await this.groups.find({
      where: classId
        ? {
            classroom: { id: classId },
            organization: { id: In(organizationIds) },
          }
        : { organization: { id: In(organizationIds) } },
      relations: {
        organization: true,
        classroom: { advisor: true, books: { teacher: true } },
        memberships: true,
      },
      order: { name: "ASC" },
    });
    return rows
      .filter((group) => this.canReadGroup(user, group))
      .map((group) => this.view(group));
  }

  async create(user: AuthenticatedUser, dto: CreateClassGroupDto) {
    this.requireCapability(user, "class_groups.manage");
    const classroom = await this.classes.findOne({
      where: { id: dto.classId },
      relations: { organization: true },
    });
    if (!classroom)
      throw new ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
    await this.access.organizationForUser(user, classroom.organization.id);
    this.assertWorkOrganization(user, classroom.organization.id);
    if (classroom.status !== "ACTIVE")
      throw new ApiException(
        409,
        "CLASS_ARCHIVED",
        "برای کلاس بایگانی‌شده نمی‌توان گروه ساخت.",
      );
    const code = dto.code.trim().toLowerCase();
    this.validateIdentity(dto.name.trim(), code);
    if (
      await this.groups.findOne({
        where: { organization: { id: classroom.organization.id }, code },
      })
    )
      throw new ApiException(
        409,
        "CLASS_GROUP_CODE_EXISTS",
        "این کد گروه در مدرسه تکراری است.",
      );
    try {
      const group = await this.groups.save(
        this.groups.create({
          organization: classroom.organization,
          classroom,
          code,
          name: dto.name.trim(),
          description: dto.description?.trim() || "",
          status: "ACTIVE",
        }),
      );
      return this.view(await this.requireGroup(user, group.id));
    } catch (error) {
      this.rethrowCodeConflict(error);
    }
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateClassGroupDto) {
    this.requireCapability(user, "class_groups.manage");
    const group = await this.requireGroup(user, id);
    this.assertMutable(group);
    const code = dto.code?.trim().toLowerCase() ?? group.code;
    const name = dto.name?.trim() ?? group.name;
    this.validateIdentity(name, code);
    const duplicate = await this.groups.findOne({
      where: { organization: { id: group.organization.id }, code },
    });
    if (duplicate && duplicate.id !== group.id)
      throw new ApiException(
        409,
        "CLASS_GROUP_CODE_EXISTS",
        "این کد گروه در مدرسه تکراری است.",
      );
    group.name = name;
    group.code = code;
    if (dto.description !== undefined)
      group.description = dto.description.trim();
    try {
      return this.view(await this.groups.save(group));
    } catch (error) {
      this.rethrowCodeConflict(error);
    }
  }

  async members(user: AuthenticatedUser, id: string) {
    this.requireCapability(user, "class_groups.read");
    const group = await this.requireGroup(user, id);
    const rows = await this.memberships.find({
      where: { group: { id: group.id } },
      relations: { student: { user: true } },
      order: { createdAt: "ASC" },
    });
    return rows.map((row) => ({
      id: row.student.id,
      name: row.student.name,
      nationalCode: row.student.nationalCode ?? null,
      userId: row.student.user?.id ?? null,
    }));
  }

  async setMembers(user: AuthenticatedUser, id: string, studentIds: string[]) {
    this.requireCapability(user, "class_groups.manage");
    const group = await this.requireGroup(user, id);
    this.assertMutable(group);
    if (studentIds.length > MAX_CLASS_GROUP_MEMBERS)
      throw new ApiException(
        422,
        "CLASS_GROUP_TOO_MANY_MEMBERS",
        "تعداد اعضای گروه بیش از حد مجاز است.",
      );
    const uniqueIds = [...new Set(studentIds)];
    return this.memberships.manager.transaction(async (manager) => {
      const enrolled = await manager
        .getRepository(EducationClassEnrollment)
        .find({
          where: { classroom: { id: group.classroom!.id } },
          relations: { student: { organization: true } },
        });
      const allowed = new Map(
        enrolled
          .filter(
            (row) => row.student.organization?.id === group.organization.id,
          )
          .map((row) => [row.student.id, row.student]),
      );
      if (uniqueIds.some((studentId) => !allowed.has(studentId)))
        throw new ApiException(
          422,
          "CLASS_GROUP_MEMBER_NOT_ENROLLED",
          "همه اعضای گروه باید ابتدا عضو همین کلاس و سازمان باشند.",
        );
      const memberships = manager.getRepository(StudyGroupMembership);
      await memberships.delete({ group: { id: group.id } });
      if (uniqueIds.length)
        await memberships.save(
          uniqueIds.map((studentId) =>
            memberships.create({ group, student: allowed.get(studentId)! }),
          ),
        );
      return { groupId: group.id, count: uniqueIds.length };
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    this.requireCapability(user, "class_groups.manage");
    const group = await this.requireGroup(user, id);
    await this.groups.remove(group);
    return { deleted: true };
  }

  private async requireGroup(user: AuthenticatedUser, id: string) {
    const group = await this.groups.findOne({
      where: { id },
      relations: {
        organization: true,
        classroom: { advisor: true, books: { teacher: true } },
        memberships: true,
      },
    });
    if (!group)
      throw new ApiException(
        404,
        "CLASS_GROUP_NOT_FOUND",
        "گروه کلاس پیدا نشد.",
      );
    this.assertWorkOrganization(user, group.organization.id);
    await this.access.organizationForUser(user, group.organization.id);
    if (!this.canReadGroup(user, group))
      throw new ApiException(
        403,
        "CLASS_GROUP_FORBIDDEN",
        "این کلاس به شما واگذار نشده است.",
      );
    return group;
  }

  private requireCapability(user: AuthenticatedUser, capability: string) {
    if (!user.capabilities?.includes(capability))
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
  }
  private assertWorkOrganization(
    user: AuthenticatedUser,
    organizationId: string,
  ) {
    if (
      user.activeOrganizationId &&
      user.activeOrganizationId !== organizationId
    )
      throw new ApiException(
        403,
        "CLASS_GROUP_WORK_CONTEXT_MISMATCH",
        "ابتدا سازمان فعال را تغییر دهید.",
      );
  }
  private canReadGroup(
    user: AuthenticatedUser,
    group: Pick<StudyGroup, "classroom">,
  ) {
    return (
      this.access.isPlatform(user) ||
      ["class_groups.manage", "students.read.all", "classes.manage"].some(
        (capability) => user.capabilities?.includes(capability),
      ) ||
      group.classroom?.advisor?.id === user.id ||
      Boolean(
        group.classroom?.books?.some((book) => book.teacher?.id === user.id),
      )
    );
  }
  private assertMutable(group: StudyGroup) {
    if (!group.classroom)
      throw new ApiException(
        409,
        "CLASS_GROUP_CLASS_REQUIRED",
        "این گروه هنوز به کلاس متصل نشده است.",
      );
    if (group.status !== "ACTIVE" || group.classroom.status !== "ACTIVE")
      throw new ApiException(
        409,
        "CLASS_GROUP_ARCHIVED",
        "اعضای کلاس یا گروه بایگانی‌شده قابل تغییر نیستند.",
      );
  }
  private validateIdentity(name: string, code: string) {
    if (!name || !code)
      throw new ApiException(
        422,
        "CLASS_GROUP_INVALID_IDENTITY",
        "نام و کد گروه الزامی است.",
      );
  }
  private rethrowCodeConflict(error: unknown): never {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed") &&
      error.message.includes("study_groups")
    )
      throw new ApiException(
        409,
        "CLASS_GROUP_CODE_EXISTS",
        "این کد گروه در مدرسه تکراری است.",
      );
    throw error;
  }
  private view(group: StudyGroup): ClassGroupSummary {
    return {
      id: group.id,
      code: group.code,
      name: group.name,
      description: group.description,
      status: group.status,
      organizationId: group.organization.id,
      classId: group.classroom?.id ?? null,
      className: group.classroom?.name ?? null,
      memberCount: group.memberships?.length ?? 0,
    };
  }
}
