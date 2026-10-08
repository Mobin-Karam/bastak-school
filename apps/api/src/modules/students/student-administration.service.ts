import bcrypt from "bcryptjs";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  MembershipStatus,
  OrganizationMembership,
} from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { Role } from "../../database/entities/role.entity";
import { Student } from "../../database/entities/student.entity";
import {
  RelationshipStatus,
  UserRelationship,
} from "../../database/entities/user-relationship.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import {
  User,
  UserRole,
  UserStatus,
} from "../../database/entities/user.entity";
import { AuthorizationService, UserContext } from "../authorization";
import { AuthenticatedUser } from "../auth";
import { CreateStudentDto, UpdateStudentDto } from "./dto/student-admin.dto";
import { StudentsService } from "./students.service";
import {
  CreateLearningItemDto,
  UpdateLearningItemDto,
} from "./dto/learning.dto";
import { TaskIssue } from "../../database/entities/task-issue.entity";
import { RecoveryRequest } from "../../database/entities/recovery-request.entity";
import { AttendanceRecord } from "../../database/entities/attendance-record.entity";
import {
  LearningItem,
  LearningStatus,
} from "../../database/entities/learning-item.entity";
import {
  ExamRetryRequest,
  RetryRequestStatus,
} from "../../database/entities/exam-retry-request.entity";
import { UpdateTaskIssueDto } from "./dto/task-issue.dto";
import { EducationCatalogService } from "../education-catalog";
import { normalizeIranianMobile } from "../../common/utils/phone-number";

@Injectable()
export class StudentAdministrationService {
  constructor(
    @InjectRepository(Student) private students: Repository<Student>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(AttendanceRecord)
    private attendanceRecords: Repository<AttendanceRecord>,
    @InjectRepository(OrganizationMembership)
    private memberships: Repository<OrganizationMembership>,
    @InjectRepository(UserRelationship)
    private relationships: Repository<UserRelationship>,
    @InjectRepository(TaskIssue) private issues: Repository<TaskIssue>,
    @InjectRepository(RecoveryRequest)
    private recoveries: Repository<RecoveryRequest>,
    @InjectRepository(LearningItem)
    private learningItems: Repository<LearningItem>,
    @InjectRepository(ExamRetryRequest)
    private retryRequests: Repository<ExamRetryRequest>,
    private authorization: AuthorizationService,
    private legacy: StudentsService,
    private dataSource: DataSource,
    private catalog: EducationCatalogService,
  ) {}
  private context(user: AuthenticatedUser): UserContext {
    return {
      ...user,
      roles: user.roles ?? [user.role],
      capabilities: user.capabilities ?? [],
      membershipIds: user.membershipIds ?? [],
      organizationIds: user.organizationIds ?? [],
    };
  }
  async list(user: AuthenticatedUser, organizationId?: string) {
    const context = this.context(user);
    const schoolWide =
      context.roles.includes("PLATFORM_ADMIN") ||
      [
        "ORGANIZATION_ADMIN",
        "PRINCIPAL",
        "DISCIPLINARIAN",
        "RELIGIOUS_EDUCATION_MANAGER",
        "GOVERNMENT_EDUCATION_MANAGER",
      ].some((role) => context.roles.includes(role));

    if (schoolWide) {
      const allowedOrganizationIds = context.roles.includes("PLATFORM_ADMIN")
        ? organizationId
          ? [organizationId]
          : undefined
        : organizationId
          ? context.organizationIds.filter((id) => id === organizationId)
          : context.organizationIds;
      if (
        organizationId &&
        allowedOrganizationIds &&
        !allowedOrganizationIds.length
      )
        return [];
      const rows = await this.students.find({
        where: allowedOrganizationIds?.length
          ? { organization: { id: In(allowedOrganizationIds) } }
          : undefined,
        relations: { user: true, organization: true },
        order: { createdAt: "DESC" },
      });
      return rows.map((student) => this.project(student));
    }

    const links = await this.relationships.find({
      where: { fromUser: { id: user.id }, status: RelationshipStatus.ACTIVE },
      relations: { toStudent: { user: true, organization: true } },
    });
    const own = context.roles.includes("STUDENT")
      ? await this.students.find({
          where: { user: { id: user.id } },
          relations: { user: true, organization: true },
        })
      : [];
    const linked = links.map((link) => link.toStudent);
    const unique = new Map(
      [...own, ...linked].map((student) => [student.id, student]),
    );
    return [...unique.values()].map((student) => this.project(student));
  }

  async get(user: AuthenticatedUser, id: string, capability = "students.read") {
    if (
      !(await this.authorization.canAccessStudent(
        this.context(user),
        id,
        capability,
      ))
    )
      throw new ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
    const student = await this.students.findOne({
      where: { id },
      relations: { user: true, organization: true },
    });
    if (!student)
      throw new ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
    return this.project(student);
  }

  async profile(user: AuthenticatedUser, id: string) {
    await this.get(user, id, "students.read");
    const student = await this.students.findOne({
      where: { id },
      relations: { user: true, organization: true },
    });
    if (!student) {
      throw new ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
    }

    const records = await this.attendanceRecords.find({
      where: { student: { id } },
      relations: { session: { organization: true } },
      order: { createdAt: "DESC" },
      take: 10,
    });

    const summary = {
      totalSessions: records.length,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };
    for (const record of records) {
      if (record.status === "present") summary.present += 1;
      if (record.status === "absent") summary.absent += 1;
      if (record.status === "late") summary.late += 1;
      if (record.status === "excused") summary.excused += 1;
    }

    return {
      ...this.project(student),
      identity: {
        firstName: student.user?.firstName ?? "",
        lastName: student.user?.lastName ?? "",
        fullName: student.name,
        nationalCode: student.nationalCode ?? null,
        phoneNumber: student.user?.phoneNumber ?? null,
        email: student.user?.email ?? null,
        profilePhoto: student.user?.chatAvatarUrl ?? "",
      },
      contact: {
        phoneNumber: student.user?.phoneNumber ?? null,
        email: student.user?.email ?? null,
      },
      education: {
        learnerProfile: student.learnerProfile,
        independentType: student.independentType ?? null,
        learningLevel: student.learningLevel,
        gradeId: student.gradeId ?? null,
        educationTypeId: student.educationTypeId,
        trackId: student.trackId,
        grade: student.grade,
        major: student.major,
        targetUniversity: student.targetUniversity,
        targetField: student.targetField,
        targetRank: student.targetRank,
        dailyCapacity: student.dailyCapacity,
      },
      attendanceSummary: summary,
      recentAttendance: records.map((record) => ({
        id: record.id,
        sessionId: record.session.id,
        status: record.status,
        sessionDate: record.session.sessionDate.toISOString(),
        contextType: record.session.contextType,
        contextId: record.session.contextId,
        organizationId: record.session.organization.id,
        recordedAt: record.createdAt.toISOString(),
      })),
    };
  }

  async updateProfile(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateStudentDto,
  ) {
    await this.get(user, id, "students.update");
    const student = await this.students.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!student) {
      throw new ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
    }

    const change = await this.legacy.update(id, {
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.learnerProfile ? { learnerProfile: dto.learnerProfile } : {}),
      ...(dto.independentType ? { independentType: dto.independentType } : {}),
      ...(dto.learningLevel !== undefined
        ? { learningLevel: dto.learningLevel }
        : {}),
      ...(dto.gradeId !== undefined ? { gradeId: dto.gradeId } : {}),
      ...(dto.educationTypeId !== undefined
        ? { educationTypeId: dto.educationTypeId }
        : {}),
      ...(dto.trackId !== undefined ? { trackId: dto.trackId } : {}),
      ...(dto.grade !== undefined ? { grade: dto.grade } : {}),
      ...(dto.major !== undefined ? { major: dto.major } : {}),
      ...(dto.targetUniversity !== undefined
        ? { targetUniversity: dto.targetUniversity }
        : {}),
      ...(dto.targetField !== undefined
        ? { targetField: dto.targetField }
        : {}),
      ...(dto.targetRank !== undefined ? { targetRank: dto.targetRank } : {}),
      ...(dto.dailyCapacity !== undefined
        ? { dailyCapacity: dto.dailyCapacity }
        : {}),
    });

    if (student.user && dto.phoneNumber) {
      const normalized = normalizeIranianMobile(dto.phoneNumber);
      await this.users.update(student.user.id, {
        phoneNumber: normalized,
        username: normalized,
      });
    }

    if (student.user && (dto.name || dto.phoneNumber)) {
      const merged = {
        ...(dto.name ? { firstName: dto.name.split(" ")[0] ?? "" } : {}),
        ...(dto.name
          ? { lastName: dto.name.split(" ").slice(1).join(" ") ?? "" }
          : {}),
      };
      if (Object.keys(merged).length) {
        await this.users.update(student.user.id, merged);
      }
    }

    return this.profile(user, id);
  }
  async create(actor: AuthenticatedUser, dto: CreateStudentDto) {
    const context = this.context(actor);
    this.authorization.requireCapability(context, "students.create");
    if (
      !context.roles.includes("PLATFORM_ADMIN") &&
      (!dto.organizationId ||
        !context.organizationIds.includes(dto.organizationId))
    )
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "به این سازمان دسترسی ندارید.",
      );
    const profile = dto.learnerProfile ?? "school";
    if (profile === "independent" && !dto.independentType)
      throw new ApiException(
        422,
        "INDEPENDENT_TYPE_REQUIRED",
        "نوع یادگیرنده مستقل را انتخاب کنید.",
      );
    const education =
      profile === "school"
        ? this.catalog.validateSelection(
            dto.gradeId!,
            dto.educationTypeId!,
            dto.trackId,
          )
        : null;
    return this.dataSource.transaction(async (manager) => {
      const phoneNumber = normalizeIranianMobile(dto.phoneNumber);
      const username = phoneNumber;
      const [firstName = "", ...lastNameParts] = dto.name.trim().split(/\s+/);
      if (await manager.findOne(User, { where: { phoneNumber } }))
        throw new ApiException(
          409,
          "PHONE_NUMBER_EXISTS",
          "شماره همراه تکراری است.",
        );
      const user = await manager.save(
        User,
        manager.create(User, {
          username,
          phoneNumber,
          passwordHash: await bcrypt.hash(dto.password, 12),
          firstName,
          lastName: lastNameParts.join(" "),
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
        }),
      );
      const organization = dto.organizationId
        ? await manager.findOne(Organization, {
            where: { id: dto.organizationId },
          })
        : null;
      if (dto.organizationId && !organization)
        throw new ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
      const student = await manager.save(
        Student,
        manager.create(Student, {
          user,
          organization,
          name: dto.name,
          learnerProfile: profile,
          independentType:
            profile === "independent" ? dto.independentType! : null,
          learningLevel:
            profile === "independent" ? dto.learningLevel?.trim() || "" : "",
          gradeId: education?.gradeId ?? null,
          educationTypeId: education?.educationTypeId ?? "independent",
          trackId: education?.trackId ?? "independent",
          grade: education?.gradeLabel ?? "",
          major: education?.trackLabel ?? "",
          targetUniversity: dto.targetUniversity?.trim() || "",
          targetField: dto.targetField?.trim() || "",
          targetRank: dto.targetRank?.trim() || "",
          dailyCapacity: dto.dailyCapacity?.trim() || "",
          accountStatus: "active",
        }),
      );
      const role = await manager.findOneByOrFail(Role, { code: "STUDENT" });
      // Create the school link before the role assignment.  The STUDENT role
      // is currently global for backwards compatibility, but this preserves
      // the correct association if its scope is tightened later.
      const membership = organization
        ? await manager.save(
            OrganizationMembership,
            manager.create(OrganizationMembership, {
              user,
              organization,
              status: MembershipStatus.ACTIVE,
            }),
          )
        : null;
      await manager.save(
        UserRoleAssignment,
        manager.create(UserRoleAssignment, {
          user,
          role,
          membership: role.organizationScoped ? membership : null,
        }),
      );
      return this.project(student);
    });
  }
  async update(actor: AuthenticatedUser, id: string, dto: UpdateStudentDto) {
    await this.get(actor, id, "students.update");
    const existing = await this.students.findOneByOrFail({ id });
    const profile = dto.learnerProfile ?? existing.learnerProfile;
    const independentType =
      dto.independentType ?? existing.independentType ?? undefined;
    const hasEducationUpdate =
      dto.gradeId !== undefined ||
      dto.educationTypeId !== undefined ||
      dto.trackId !== undefined;
    if (
      profile === "school" &&
      hasEducationUpdate &&
      (!dto.gradeId || !dto.educationTypeId)
    ) {
      throw new ApiException(
        422,
        "INVALID_EDUCATION_SELECTION",
        "پایه و نوع آموزش باید با هم ارسال شوند.",
      );
    }
    if (profile === "independent" && !independentType)
      throw new ApiException(
        422,
        "INDEPENDENT_TYPE_REQUIRED",
        "نوع یادگیرنده مستقل را انتخاب کنید.",
      );
    const education =
      profile === "school" && hasEducationUpdate
        ? this.catalog.validateSelection(
            dto.gradeId!,
            dto.educationTypeId!,
            dto.trackId,
          )
        : null;
    const updated = await this.dataSource.transaction(async (manager) => {
      const student = await manager.findOneOrFail(Student, {
        where: { id },
        relations: { user: true },
      });
      const { phoneNumber: requestedPhoneNumber, ...studentFields } = dto;
      const requestedStudentName = dto.name?.trim();
      const studentUpdate = {
        ...studentFields,
        ...(requestedStudentName ? { name: requestedStudentName } : {}),
        ...(education
          ? {
              gradeId: education.gradeId,
              educationTypeId: education.educationTypeId,
              trackId: education.trackId,
              grade: education.gradeLabel,
              major: education.trackLabel,
            }
          : {}),
        ...(profile === "independent"
          ? {
              learnerProfile: profile,
              independentType,
              learningLevel:
                dto.learningLevel?.trim() ?? existing.learningLevel ?? "",
              gradeId: null,
              educationTypeId: "independent",
              trackId: "independent",
              grade: "",
              major: "",
            }
          : {
              learnerProfile: "school" as const,
              independentType: null,
              learningLevel: "",
            }),
      };
      manager.merge(Student, student, studentUpdate);

      if (
        student.user &&
        (requestedPhoneNumber !== undefined || requestedStudentName)
      ) {
        const phoneNumber =
          requestedPhoneNumber !== undefined
            ? normalizeIranianMobile(requestedPhoneNumber)
            : student.user.phoneNumber;
        if (phoneNumber) {
          const duplicate = await manager.findOne(User, {
            where: { phoneNumber },
          });
          if (duplicate && duplicate.id !== student.user.id) {
            throw new ApiException(
              409,
              "PHONE_NUMBER_EXISTS",
              "شماره همراه تکراری است.",
            );
          }
        }
        const [firstName = "", ...lastNameParts] = (requestedStudentName ?? student.name)
          .trim()
          .split(/\s+/);
        manager.merge(User, student.user, {
          ...(phoneNumber ? { phoneNumber, username: phoneNumber } : {}),
          firstName,
          lastName: lastNameParts.join(" "),
        });
        await manager.save(User, student.user);
      }

      return manager.save(Student, student);
    });
    return this.project({ ...updated, user: updated.user ?? undefined });
  }
  async lifecycle(
    actor: AuthenticatedUser,
    id: string,
    action: "activate" | "deactivate" | "restore" | "force-logout",
  ) {
    await this.get(actor, id, "students.update");
    return this.legacy.lifecycle(id, action);
  }
  async remove(actor: AuthenticatedUser, id: string) {
    await this.get(actor, id, "students.archive");
    return this.legacy.remove(id);
  }
  async resetPassword(actor: AuthenticatedUser, id: string, password: string) {
    await this.get(actor, id, "students.update");
    return this.legacy.resetPassword(id, password);
  }
  async learning(actor: AuthenticatedUser, id: string) {
    await this.get(actor, id, "learning.read");
    return this.legacy.learningForStudent(id);
  }
  async createLearning(
    actor: AuthenticatedUser,
    id: string,
    dto: CreateLearningItemDto,
  ) {
    await this.get(actor, id, "learning.create");
    return this.legacy.createLearningItem(id, dto);
  }
  async updateLearning(
    actor: AuthenticatedUser,
    id: string,
    itemId: string,
    dto: UpdateLearningItemDto,
  ) {
    await this.get(actor, id, "learning.update");
    return this.legacy.updateLearningItem(id, itemId, dto);
  }
  async deleteLearning(actor: AuthenticatedUser, id: string, itemId: string) {
    await this.get(actor, id, "learning.update");
    return this.legacy.deleteLearningItem(id, itemId);
  }
  async reviewLearning(
    actor: AuthenticatedUser,
    id: string,
    itemId: string,
    rating: number,
  ) {
    await this.get(actor, id, "learning.review");
    return this.legacy.reviewLearningItem(id, itemId, rating);
  }
  async learningHistory(actor: AuthenticatedUser, id: string, itemId: string) {
    await this.get(actor, id, "learning.read");
    return this.legacy.learningReviewHistory(id, itemId);
  }
  async weekly(actor: AuthenticatedUser, id: string) {
    await this.get(actor, id, "student.progress.read");
    return this.legacy.weeklyForStudent(id);
  }
  async topics(actor: AuthenticatedUser, id: string, limit = 8) {
    await this.get(actor, id, "student.progress.read");
    return this.legacy.topicsForStudent(id, limit);
  }
  async advisorInbox(actor: AuthenticatedUser, id: string) {
    await this.get(actor, id, "students.read");
    const today = new Date().toISOString().slice(0, 10);
    const [issues, recoveryRequests, reviews, examRetryRequests] =
      await Promise.all([
        this.issues.find({
          where: { student: { id } },
          relations: { task: true },
          order: { createdAt: "DESC" },
          take: 50,
        }),
        this.recoveries.find({
          where: { student: { id } },
          order: { createdAt: "DESC" },
          take: 50,
        }),
        this.learningItems.find({
          where: { student: { id }, status: LearningStatus.PENDING },
          order: { dueDate: "ASC" },
          take: 50,
        }),
        this.retryRequests.find({
          where: { student: { id }, status: RetryRequestStatus.PENDING },
          relations: { exam: true },
          order: { createdAt: "DESC" },
          take: 50,
        }),
      ]);
    return {
      issues: issues.map((x) => ({
        ...x,
        status: x.status.toLowerCase(),
        studentId: id,
        taskId: x.task?.id,
        issueType: x.type,
        note: x.description,
      })),
      recoveryRequests,
      reviews: reviews.filter((x) => x.dueDate <= today),
      missedTasks: [],
      examRetryRequests: examRetryRequests.map((x) => ({
        ...x,
        examTitle: x.exam?.title,
      })),
    };
  }
  async updateTaskIssue(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateTaskIssueDto,
  ) {
    const issue = await this.issues.findOne({
      where: { id },
      relations: { student: true },
    });
    if (!issue)
      throw new ApiException(
        404,
        "TASK_ISSUE_NOT_FOUND",
        "گزارش مشکل پیدا نشد.",
      );
    await this.get(actor, issue.student.id, "tasks.update");
    issue.status = dto.status.toUpperCase();
    if (dto.advisorNote !== undefined)
      issue.advisorNote = dto.advisorNote.trim();
    return this.issues.save(issue);
  }
  private project(student: Student) {
    return {
      id: student.id,
      name: student.name,
      gradeId: student.gradeId,
      learnerProfile: student.learnerProfile,
      independentType: student.independentType,
      learningLevel: student.learningLevel,
      educationTypeId: student.educationTypeId,
      trackId: student.trackId,
      grade: student.grade,
      major: student.major,
      targetUniversity: student.targetUniversity,
      targetField: student.targetField,
      targetRank: student.targetRank,
      dailyCapacity: student.dailyCapacity,
      accountStatus: student.accountStatus,
      registrationStatus: student.registrationStatus,
      organization: student.organization
        ? { id: student.organization.id, name: student.organization.name }
        : null,
      phoneNumber: student.user?.phoneNumber ?? null,
      user: student.user
        ? {
            id: student.user.id,
            username: student.user.username,
            phoneNumber: student.user.phoneNumber ?? null,
            status: student.user.status,
          }
        : null,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}
