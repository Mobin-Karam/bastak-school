import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import bcrypt from "bcryptjs";
import { ApiException } from "../../common/exceptions/api.exception";
import { MembershipStatus, OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization, OrganizationStatus } from "../../database/entities/organization.entity";
import { Role } from "../../database/entities/role.entity";
import { Student } from "../../database/entities/student.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { RelationshipStatus, RelationshipType, UserRelationship } from "../../database/entities/user-relationship.entity";
import { User, UserRole, UserStatus } from "../../database/entities/user.entity";
import { Conversation } from "../../database/entities/conversation.entity";
import { ConversationMember } from "../../database/entities/conversation-member.entity";
import { ConversationType } from "../../database/entities/conversation.entity";
import { AssignStudentOnboardingDto, PlatformBootstrapDto, SetOrganizationStudentSignupDto, StudentSignupDto } from "./onboarding.dto";
import { EducationCatalogService } from "../education-catalog";
import { isValidIranianNationalCode, normalizeNationalCode } from "./national-code";
import { AuthenticatedUser } from "../auth";

@Injectable()
export class OnboardingService {
  constructor(private dataSource: DataSource, private catalog: EducationCatalogService) {}

  async signup(dto: StudentSignupDto) {
    const nationalCode = normalizeNationalCode(dto.nationalCode);
    if (!isValidIranianNationalCode(nationalCode)) throw new ApiException(422, "INVALID_NATIONAL_CODE", "کد ملی معتبر نیست.");
    const education = this.catalog.validateSelection(dto.grade, dto.educationTypeId, dto.trackId);
    try { return await this.dataSource.transaction(async (manager) => {
      const policy = await this.platformSignupPolicy(manager);
      if (!policy.enabled) throw new ApiException(403, "STUDENT_SIGNUP_DISABLED", "ثبت‌نام مستقیم دانش‌آموز توسط پلتفرم غیرفعال است. اطلاعات خود را به سازمان آموزشی بدهید.");
      const organization = await manager.findOne(Organization, { where: { id: dto.organizationId, status: OrganizationStatus.ACTIVE } });
      if (!organization || !organization.studentSignupEnabled || organization.studentSignupLimit < 1)
        throw new ApiException(403, "ORGANIZATION_SIGNUP_DISABLED", "این سازمان ثبت‌نام مستقیم دانش‌آموز را فعال نکرده است.");
      await manager.query(
        `UPDATE organizations SET studentSignupCount=studentSignupCount+1
         WHERE id=? AND status='ACTIVE' AND studentSignupEnabled=1
           AND studentSignupCount<studentSignupLimit`,
        [organization.id],
      );
      // SQLite's raw UPDATE result differs across TypeORM drivers. `changes()` is
      // connection-local, so inside this transaction it is the reliable capacity
      // reservation outcome and prevents concurrent signups from exceeding a cap.
      const [reservation] = await manager.query(`SELECT changes() AS changes`);
      if (!Number(reservation?.changes))
        throw new ApiException(409, "ORGANIZATION_SIGNUP_LIMIT_REACHED", "ظرفیت ثبت‌نام مستقیم این سازمان تکمیل شده است. با سازمان تماس بگیرید.");
      const username = nationalCode;
      if (await manager.findOne(Student, { where: { nationalCode } })) throw new ApiException(409, "NATIONAL_CODE_EXISTS", "برای این کد ملی قبلاً حساب ساخته شده است.");
      if (await manager.findOne(User, { where: { username } })) throw new ApiException(409, "NATIONAL_CODE_EXISTS", "برای این کد ملی قبلاً حساب ساخته شده است.");
      const user = await manager.save(User, manager.create(User, { username, passwordHash: await bcrypt.hash(dto.password, 12), role: UserRole.STUDENT, status: UserStatus.ACTIVE }));
      const student = await manager.save(Student, manager.create(Student, { user, name: dto.name.trim(), nationalCode, gradeId: education.gradeId, grade: education.gradeLabel, educationTypeId: education.educationTypeId, trackId: education.trackId, major: education.trackLabel, targetUniversity: "", targetField: "", targetRank: "", dailyCapacity: "", accountStatus: "active", onboardingStatus: "PENDING_ASSIGNMENT" }));
      const role = await manager.findOneByOrFail(Role, { code: "STUDENT" });
      await manager.save(UserRoleAssignment, manager.create(UserRoleAssignment, { user, role, membership: null }));
      await manager.save(OrganizationMembership, manager.create(OrganizationMembership, { organization, user, status: MembershipStatus.ACTIVE }));
      return { id: student.id, username, nationalCode, grade: student.grade, major: student.major, onboardingStatus: student.onboardingStatus, organization: { id: organization.id, name: organization.name } };
    }); } catch (error) {
      if (String((error as { message?: string })?.message || "").includes("students.nationalCode")) throw new ApiException(409, "NATIONAL_CODE_EXISTS", "برای این کد ملی قبلاً حساب ساخته شده است.");
      throw error;
    }
  }

  async publicSignupOptions() {
    const policy = await this.platformSignupPolicy(this.dataSource.manager);
    if (!policy.enabled) return { enabled: false, organizations: [] };
    const organizations = await this.dataSource.getRepository(Organization).find({
      where: { status: OrganizationStatus.ACTIVE, studentSignupEnabled: true },
      order: { name: "ASC" },
    });
    return {
      enabled: true,
      organizations: organizations
        .filter((organization) => organization.studentSignupLimit > organization.studentSignupCount)
        .map((organization) => ({ id: organization.id, name: organization.name, type: organization.type, remaining: organization.studentSignupLimit - organization.studentSignupCount })),
    };
  }

  async setPlatformSignupPolicy(user: AuthenticatedUser, enabled: boolean) {
    if (!(user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN")) throw new ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند ثبت‌نام مستقیم را کنترل کند.");
    await this.dataSource.query(
      `UPDATE platform_enrollment_settings SET publicStudentSignupEnabled=?, updatedAt=datetime('now') WHERE id=1`,
      [enabled ? 1 : 0],
    );
    return this.publicSignupOptions();
  }

  async getPlatformSignupPolicy(user: AuthenticatedUser) {
    if (!(user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN")) throw new ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند تنظیمات سراسری ثبت‌نام را ببیند.");
    return this.platformSignupPolicy(this.dataSource.manager);
  }

  async setOrganizationSignupPolicy(user: AuthenticatedUser, organizationId: string, dto: SetOrganizationStudentSignupDto) {
    const platform = Boolean(user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN");
    if (!platform && !user.organizationIds?.includes(organizationId)) throw new ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
    const organization = await this.dataSource.getRepository(Organization).findOneBy({ id: organizationId });
    if (!organization) throw new ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
    if (!platform && !organization.studentSignupManagedByOrganization)
      throw new ApiException(403, "SIGNUP_POLICY_DELEGATION_REQUIRED", "مدیر پلتفرم هنوز مدیریت ثبت‌نام دانش‌آموز را به این سازمان واگذار نکرده است.");
    if (!platform && dto.managedByOrganization !== undefined)
      throw new ApiException(403, "FORBIDDEN", "تنها مدیر پلتفرم می‌تواند واگذاری مدیریت ثبت‌نام را تغییر دهد.");
    if (dto.managedByOrganization !== undefined) organization.studentSignupManagedByOrganization = dto.managedByOrganization;
    if (dto.enabled !== undefined) organization.studentSignupEnabled = dto.enabled;
    if (dto.limit !== undefined) organization.studentSignupLimit = dto.limit;
    await this.dataSource.getRepository(Organization).save(organization);
    return {
      id: organization.id,
      managedByOrganization: organization.studentSignupManagedByOrganization,
      enabled: organization.studentSignupEnabled,
      limit: organization.studentSignupLimit,
      used: organization.studentSignupCount,
    };
  }

  private async platformSignupPolicy(manager: EntityManager) {
    const [row] = await manager.query(`SELECT publicStudentSignupEnabled enabled FROM platform_enrollment_settings WHERE id=1`);
    return { enabled: Boolean(row?.enabled) };
  }

  async platformBootstrapStatus() {
    const owner = await this.dataSource.getRepository(User).findOne({ where: { isPlatformOwner: true } });
    return { setupRequired: !owner };
  }

  async bootstrapPlatformAdmin(dto: PlatformBootstrapDto) {
    const username = dto.username.trim().toLowerCase();
    const email = dto.email.trim().toLowerCase();
    return this.dataSource.transaction(async (manager) => {
      const assignments = manager.getRepository(UserRoleAssignment);
      if (await manager.findOne(User, { where: { isPlatformOwner: true } })) {
        throw new ApiException(409, "PLATFORM_ALREADY_BOOTSTRAPPED", "مدیر پلتفرم قبلاً ایجاد شده است.");
      }
      const users = manager.getRepository(User);
      if (await users.findOne({ where: [{ username }, { email }] })) {
        throw new ApiException(409, "ACCOUNT_EXISTS", "نام کاربری یا ایمیل قبلاً استفاده شده است.");
      }
      const role = await manager.findOne(Role, { where: { code: "PLATFORM_ADMIN" } });
      if (!role) throw new ApiException(503, "PLATFORM_BOOTSTRAP_UNAVAILABLE", "راه‌اندازی پایگاه داده کامل نشده است.");
      const user = await manager.save(User, manager.create(User, {
        username,
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        passwordHash: await bcrypt.hash(dto.password, 12),
        role: UserRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
        isPlatformOwner: true,
      }));
      await manager.save(UserRoleAssignment, assignments.create({ user, role, membership: null }));
      return { id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName };
    });
  }

  async pending() {
    const rows = await this.dataSource.getRepository(Student).find({ where: { onboardingStatus: "PENDING_ASSIGNMENT" }, relations: { user: true }, order: { createdAt: "ASC" } });
    return rows.map((student) => ({ id: student.id, name: student.name, nationalCode: student.nationalCode, grade: student.grade, major: student.major, username: student.user?.username, createdAt: student.createdAt }));
  }

  async assign(studentId: string, dto: AssignStudentOnboardingDto) {
    return this.dataSource.transaction(async (manager) => {
      const choice = dto.mode === "AUTO" ? await this.automaticAssignment(manager) : { organizationId: dto.organizationId, advisorUserId: dto.advisorUserId };
      const [student, organization, advisor, advisorRole, advisorMembership] = await Promise.all([
        manager.findOne(Student, { where: { id: studentId }, relations: { user: true } }),
        manager.findOne(Organization, { where: { id: choice.organizationId, status: OrganizationStatus.ACTIVE } }),
        manager.findOne(User, { where: { id: choice.advisorUserId, status: UserStatus.ACTIVE } }),
        manager.findOne(UserRoleAssignment, { where: { user: { id: choice.advisorUserId }, role: { code: "ADVISOR" }, membership: { organization: { id: choice.organizationId }, status: MembershipStatus.ACTIVE } }, relations: { role: true, user: true, membership: { organization: true } } }),
        manager.findOne(OrganizationMembership, { where: { user: { id: choice.advisorUserId }, organization: { id: choice.organizationId }, status: MembershipStatus.ACTIVE } }),
      ]);
      if (!student?.user || !organization) throw new ApiException(404, "NOT_FOUND", "دانش‌آموز یا سازمان پیدا نشد.");
      const studentUser = student.user;
      if (!advisor || !advisorRole || !advisorMembership) throw new ApiException(400, "INVALID_ADVISOR", "مشاور باید عضو فعال سازمان انتخاب‌شده باشد.");
      let membership = await manager.findOne(OrganizationMembership, { where: { organization: { id: organization.id }, user: { id: studentUser.id } } });
      membership = await manager.save(OrganizationMembership, membership ? Object.assign(membership, { status: MembershipStatus.ACTIVE }) : manager.create(OrganizationMembership, { organization, user: studentUser, status: MembershipStatus.ACTIVE }));
      let relationship = await manager.findOne(UserRelationship, { where: { fromUser: { id: advisor.id }, toStudent: { id: student.id }, organization: { id: organization.id }, type: RelationshipType.ADVISOR_OF } });
      relationship = await manager.save(UserRelationship, relationship ? Object.assign(relationship, { status: RelationshipStatus.ACTIVE, acceptedAt: new Date(), revokedAt: null }) : manager.create(UserRelationship, { fromUser: advisor, toStudent: student, organization, type: RelationshipType.ADVISOR_OF, status: RelationshipStatus.ACTIVE, acceptedAt: new Date() }));
      const advisorConversations = await manager.find(ConversationMember, { where: { user: { id: advisor.id } }, relations: { conversation: { members: { user: true } } } });
      let conversation = advisorConversations.find((item) => item.conversation.type === ConversationType.DIRECT && !item.leftAt && item.conversation.members.some((member) => member.user.id === studentUser.id && !member.leftAt))?.conversation;
      if (!conversation) {
        conversation = await manager.save(Conversation, manager.create(Conversation, { type: ConversationType.DIRECT, title: "", owner: advisor }));
        await manager.save(ConversationMember, [manager.create(ConversationMember, { conversation, user: advisor }), manager.create(ConversationMember, { conversation, user: studentUser })]);
      }
      student.onboardingStatus = "ASSIGNED";
      await manager.save(Student, student);
      return { studentId: student.id, organization: { id: organization.id, name: organization.name }, advisor: { id: advisor.id, username: advisor.username, firstName: advisor.firstName, lastName: advisor.lastName }, membershipId: membership.id, relationshipId: relationship.id, conversationId: conversation.id, onboardingStatus: student.onboardingStatus };
    });
  }

  private async automaticAssignment(manager: EntityManager) {
    const assignments = await manager.find(UserRoleAssignment, {
      where: { role: { code: "ADVISOR" }, membership: { status: MembershipStatus.ACTIVE, organization: { status: OrganizationStatus.ACTIVE } }, user: { status: UserStatus.ACTIVE } },
      relations: { role: true, user: true, membership: { organization: true } },
    });
    if (!assignments.length) throw new ApiException(409, "NO_ELIGIBLE_ADVISOR", "هیچ مشاور فعالی در سازمان‌های فعال وجود ندارد. ابتدا یک مشاور به سازمان اضافه کنید.");
    const activeRelationships = await manager.find(UserRelationship, { where: { type: RelationshipType.ADVISOR_OF, status: RelationshipStatus.ACTIVE }, relations: { fromUser: true, organization: true } });
    const load = new Map<string, number>();
    for (const relationship of activeRelationships) load.set(`${relationship.organization?.id}:${relationship.fromUser.id}`, (load.get(`${relationship.organization?.id}:${relationship.fromUser.id}`) || 0) + 1);
    const selected = [...assignments].sort((left, right) => {
      const leftKey = `${left.membership?.organization.id}:${left.user.id}`;
      const rightKey = `${right.membership?.organization.id}:${right.user.id}`;
      return (load.get(leftKey) || 0) - (load.get(rightKey) || 0) || left.membership!.organization.name.localeCompare(right.membership!.organization.name, "fa") || left.user.username.localeCompare(right.user.username);
    })[0];
    return { organizationId: selected.membership!.organization.id, advisorUserId: selected.user.id };
  }
}
