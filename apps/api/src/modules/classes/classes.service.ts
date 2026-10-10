import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { EducationBook } from "../../database/entities/education-book.entity";
import { EducationClassBook } from "../../database/entities/education-class-book.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import {
  MembershipStatus,
  OrganizationMembership,
} from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { Student } from "../../database/entities/student.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService, UserContext } from "../authorization";
import { EducationCatalogService } from "../education-catalog/education-catalog.service";
import {
  SaveEducationClassDto,
  ClassTransferDto,
  ClassTransferRowDto,
  SetClassBooksDto,
  SetClassEnrollmentsDto,
  UpdateEducationClassDto,
} from "./classes.dto";

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(EducationClass)
    private readonly classes: Repository<EducationClass>,
    @InjectRepository(EducationClassBook)
    private readonly classBooks: Repository<EducationClassBook>,
    @InjectRepository(EducationClassEnrollment)
    private readonly enrollments: Repository<EducationClassEnrollment>,
    @InjectRepository(EducationBook)
    private readonly books: Repository<EducationBook>,
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserRoleAssignment)
    private readonly roleAssignments: Repository<UserRoleAssignment>,
    private readonly authorization: AuthorizationService,
    private readonly catalog: EducationCatalogService,
  ) {}

  async list(actor: AuthenticatedUser, organizationId?: string) {
    const context = this.context(actor);
    this.authorization.requireCapability(context, "classes.read");
    const requestedOrganizationId =
      organizationId ?? actor.activeOrganizationId;
    const allowedOrganizations = this.isPlatform(context)
      ? requestedOrganizationId
        ? [requestedOrganizationId]
        : undefined
      : context.organizationIds;
    if (
      requestedOrganizationId &&
      !this.canReadOrganization(context, requestedOrganizationId)
    )
      this.forbidden();
    const rows = await this.classes.find({
      where: allowedOrganizations?.length
        ? { organization: { id: In(allowedOrganizations) } }
        : undefined,
      relations: {
        organization: true,
        advisor: true,
        books: { book: true, teacher: true },
        enrollments: { student: true },
      },
      order: { schoolYear: "DESC", name: "ASC" },
    });
    return rows
      .filter((row) => this.canSeeClass(context, row))
      .map((row) =>
        this.view(
          row,
          context.roles.length === 1 && context.roles[0] === "TEACHER"
            ? context.id
            : undefined,
        ),
      );
  }

  async assigned(actor: AuthenticatedUser, studentId?: string) {
    const context = this.context(actor);
    this.authorization.requireCapability(context, "classes.read");
    const student = studentId
      ? await this.students.findOne({
          where: { id: studentId },
          relations: { user: true, organization: true },
        })
      : await this.students.findOne({
          where: { user: { id: actor.id } },
          relations: { user: true, organization: true },
        });
    if (!student)
      throw new ApiException(
        404,
        "STUDENT_NOT_FOUND",
        "پرونده دانش‌آموز پیدا نشد.",
      );
    if (
      !(await this.authorization.canAccessStudent(
        context,
        student.id,
        "classes.read",
      ))
    )
      this.forbidden();
    const rows = await this.enrollments.find({
      where: { student: { id: student.id }, classroom: { status: "ACTIVE" } },
      relations: {
        classroom: {
          organization: true,
          advisor: true,
          books: { book: true, teacher: true },
        },
      },
      order: { classroom: { name: "ASC" } },
    });
    return rows.map((row) => this.studentView(row.classroom));
  }

  async options(actor: AuthenticatedUser, id: string) {
    const classroom = await this.requireClass(actor, id, "classes.read");
    const [books, staff, students] = await Promise.all([
      this.catalog.listBooks(
        this.hasCurriculumProfile(classroom) ? classroom.gradeId : undefined,
        this.hasCurriculumProfile(classroom)
          ? classroom.educationTypeId
          : undefined,
        this.hasCurriculumProfile(classroom) ? classroom.trackId : undefined,
        [classroom.organization.id],
      ),
      this.staffForOrganization(classroom.organization.id),
      this.eligibleStudents(classroom),
    ]);
    return {
      classroom: this.view(classroom),
      books: books.map((book) => ({
        id: book.id,
        title: book.titleFa,
        category: book.category,
        track: book.track,
      })),
      teachers: staff.filter((member) => member.roles.includes("TEACHER")),
      advisors: staff.filter(
        (member) =>
          member.roles.includes("ADVISOR") ||
          member.roles.includes("COUNSELOR") ||
          member.roles.includes("MENTOR") ||
          member.roles.includes("STUDENT_AFFAIRS_MENTOR"),
      ),
      eligibleStudents: students.map((student) => ({
        id: student.id,
        name: student.name,
        grade: student.grade,
        major: student.major,
      })),
    };
  }

  async create(actor: AuthenticatedUser, dto: SaveEducationClassDto) {
    const context = this.context(actor);
    this.authorization.requireCapability(context, "classes.manage");
    if (!this.canManageOrganization(context, dto.organizationId))
      this.forbidden();
    const organization = await this.organizations.findOneBy({
      id: dto.organizationId,
    });
    if (!organization)
      throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان پیدا نشد.");
    this.assertSchoolYear(dto.schoolYear);
    const code = dto.code.trim().toLowerCase();
    const existing = await this.classes.findOne({
      where: { organization: { id: organization.id }, code },
    });
    if (existing)
      throw new ApiException(
        409,
        "CLASS_CODE_EXISTS",
        "کد کلاس در این سازمان تکراری است.",
      );
    const classroom = await this.classes.save(
      this.classes.create({
        organization,
        code,
        name: dto.name.trim(),
        schoolYear: dto.schoolYear.trim(),
        // New school classes are not bound to one academic grade/track. Keep
        // legacy columns neutral so older catalog-linked classes remain valid.
        gradeId: 0,
        educationTypeId: "universal",
        trackId: "universal",
        capacity: dto.capacity ?? 35,
        description: "",
        advisor: null,
        status: "ACTIVE",
      }),
    );
    return this.view(await this.load(classroom.id));
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateEducationClassDto,
  ) {
    const classroom = await this.requireClass(
      actor,
      id,
      "classes.manage",
      true,
    );
    const advisor =
      dto.advisorId === undefined
        ? classroom.advisor
        : await this.resolveAdvisor(classroom.organization.id, dto.advisorId);
    if (dto.schoolYear !== undefined) this.assertSchoolYear(dto.schoolYear);
    Object.assign(classroom, {
      ...(dto.code !== undefined
        ? { code: dto.code.trim().toLowerCase() }
        : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.schoolYear !== undefined
        ? { schoolYear: dto.schoolYear.trim() }
        : {}),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description.trim() }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      advisor,
    });
    if (classroom.capacity < classroom.enrollments.length)
      throw new ApiException(
        422,
        "CLASS_CAPACITY_TOO_LOW",
        "ظرفیت نمی‌تواند از تعداد ثبت‌نام‌شدگان کمتر باشد.",
      );
    await this.classes.save(classroom);
    return this.view(await this.load(id));
  }

  async previewTransfer(actor: AuthenticatedUser, dto: ClassTransferDto) {
    await this.requireTransferOrganization(actor, dto.organizationId);
    return this.inspectTransfer(dto.organizationId, dto.rows);
  }

  async commitTransfer(actor: AuthenticatedUser, dto: ClassTransferDto) {
    await this.requireTransferOrganization(actor, dto.organizationId);
    const preview = await this.inspectTransfer(dto.organizationId, dto.rows);
    if (preview.invalid)
      return {
        committed: false,
        count: 0,
        invalid: preview.invalid,
        rows: preview.rows,
      };
    const organization = await this.organizations.findOneBy({
      id: dto.organizationId,
    });
    if (!organization)
      throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان پیدا نشد.");
    await this.classes.manager.transaction(async (manager) => {
      await manager.getRepository(EducationClass).save(
        dto.rows.map((row) =>
          manager.getRepository(EducationClass).create({
            organization,
            code: row.code.trim().toLowerCase(),
            name: row.name.trim(),
            schoolYear: row.schoolYear.trim(),
            gradeId: 0,
            educationTypeId: "universal",
            trackId: "universal",
            capacity: row.capacity ?? 35,
            description: "",
            advisor: null,
            status: "ACTIVE",
          }),
        ),
      );
    });
    return { committed: true, count: dto.rows.length, invalid: 0 };
  }

  async exportTransfer(actor: AuthenticatedUser, organizationId: string) {
    await this.requireTransferOrganization(actor, organizationId);
    const rows = await this.classes.find({
      where: { organization: { id: organizationId } },
      order: { schoolYear: "DESC", name: "ASC" },
    });
    return rows.map((row) => ({
      code: row.code,
      name: row.name,
      schoolYear: this.normalizedAcademicYear(row.schoolYear),
      capacity: row.capacity,
    }));
  }

  async remove(actor: AuthenticatedUser, id: string) {
    const classroom = await this.requireClass(
      actor,
      id,
      "classes.manage",
      true,
    );
    await this.classes.remove(classroom);
    return { deleted: true };
  }

  async setBooks(actor: AuthenticatedUser, id: string, dto: SetClassBooksDto) {
    const classroom = await this.requireClass(
      actor,
      id,
      "education.catalog.manage",
      true,
    );
    const requested = dto.books || [];
    const eligible = await this.catalog.listBooks(
      this.hasCurriculumProfile(classroom) ? classroom.gradeId : undefined,
      this.hasCurriculumProfile(classroom)
        ? classroom.educationTypeId
        : undefined,
      this.hasCurriculumProfile(classroom) ? classroom.trackId : undefined,
      [classroom.organization.id],
    );
    const eligibleIds = new Set(eligible.map((book) => book.id));
    if (requested.some((item) => !eligibleIds.has(item.bookId)))
      throw new ApiException(
        422,
        "CLASS_BOOK_PROFILE_MISMATCH",
        "یک یا چند کتاب با پایه یا نوع آموزشی کلاس سازگار نیست.",
      );
    const teachers = await Promise.all(
      requested.map((item) =>
        this.resolveTeacher(classroom.organization.id, item.teacherId),
      ),
    );
    const books = requested.length
      ? await this.books.findBy({
          id: In(requested.map((item) => item.bookId)),
        })
      : [];
    if (books.length !== requested.length)
      throw new ApiException(
        404,
        "CLASS_BOOK_NOT_FOUND",
        "یک یا چند کتاب پیدا نشد.",
      );
    await this.classBooks.delete({ classroom: { id: classroom.id } });
    if (requested.length)
      await this.classBooks.save(
        requested.map((item, index) =>
          this.classBooks.create({
            classroom,
            book: books.find((book) => book.id === item.bookId)!,
            teacher: teachers[index],
          }),
        ),
      );
    return this.view(await this.load(id));
  }

  async setEnrollments(
    actor: AuthenticatedUser,
    id: string,
    dto: SetClassEnrollmentsDto,
  ) {
    const classroom = await this.requireClass(
      actor,
      id,
      "classes.roster.manage",
    );
    const studentIds = [...new Set(dto.studentIds || [])];
    if (studentIds.length > classroom.capacity)
      throw new ApiException(
        422,
        "CLASS_CAPACITY_EXCEEDED",
        "تعداد دانش‌آموزان از ظرفیت کلاس بیشتر است.",
      );
    const students = studentIds.length
      ? await this.students.find({
          where: { id: In(studentIds) },
          relations: { user: true, organization: true },
        })
      : [];
    if (students.length !== studentIds.length)
      throw new ApiException(
        404,
        "CLASS_STUDENT_NOT_FOUND",
        "یک یا چند دانش‌آموز پیدا نشد.",
      );
    await Promise.all(
      students.map((student) => this.assertEligibleStudent(classroom, student)),
    );
    await this.enrollments.delete({ classroom: { id: classroom.id } });
    if (students.length)
      await this.enrollments.save(
        students.map((student) =>
          this.enrollments.create({ classroom, student }),
        ),
      );
    return this.view(await this.load(id));
  }

  private async requireClass(
    actor: AuthenticatedUser,
    id: string,
    capability: string,
    requireManage = false,
  ) {
    const context = this.context(actor);
    this.authorization.requireCapability(context, capability);
    const classroom = await this.load(id);
    if (
      requireManage
        ? !this.canManageOrganization(context, classroom.organization.id)
        : !this.canSeeClass(context, classroom)
    )
      this.forbidden();
    return classroom;
  }

  private async load(id: string) {
    const classroom = await this.classes.findOne({
      where: { id },
      relations: {
        organization: true,
        advisor: true,
        books: { book: true, teacher: true },
        enrollments: { student: true },
      },
    });
    if (!classroom)
      throw new ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
    return classroom;
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
  private isPlatform(context: UserContext) {
    return context.roles.includes("PLATFORM_ADMIN");
  }
  private canReadOrganization(context: UserContext, organizationId: string) {
    return (
      this.isPlatform(context) ||
      context.organizationIds.includes(organizationId)
    );
  }
  private canManageOrganization(context: UserContext, organizationId: string) {
    return (
      this.isPlatform(context) ||
      (context.capabilities.includes("education.catalog.manage") &&
        context.organizationIds.includes(organizationId)) ||
      ([
        "ORGANIZATION_ADMIN",
        "PRINCIPAL",
        "SCHOOL_SUPERVISOR",
        "RELIGIOUS_EDUCATION_MANAGER",
        "GOVERNMENT_EDUCATION_MANAGER",
      ].some((role) => context.roles.includes(role)) &&
        context.organizationIds.includes(organizationId))
    );
  }
  private canSeeClass(context: UserContext, classroom: EducationClass) {
    return (
      this.canManageOrganization(context, classroom.organization.id) ||
      classroom.advisor?.id === context.id ||
      classroom.books.some((book) => book.teacher.id === context.id)
    );
  }
  private forbidden(): never {
    throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
  }
  private async requireTransferOrganization(
    actor: AuthenticatedUser,
    organizationId: string,
  ) {
    const context = this.context(actor);
    this.authorization.requireCapability(context, "classes.manage");
    if (!this.canManageOrganization(context, organizationId)) this.forbidden();
    const organization = await this.organizations.findOneBy({
      id: organizationId,
    });
    if (!organization)
      throw new ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان پیدا نشد.");
    return organization;
  }
  private async inspectTransfer(
    organizationId: string,
    rows: ClassTransferRowDto[],
  ) {
    const existing = await this.classes.find({
      where: { organization: { id: organizationId } },
      select: { code: true },
    });
    const existingCodes = new Set(
      existing.map((item) => item.code.toLowerCase()),
    );
    const seenCodes = new Set<string>();
    const inspected = rows.map((row, index) => {
      const code = row.code?.trim().toLowerCase();
      const errors: string[] = [];
      if (!code) errors.push("ستون «کد کلاس» الزامی است.");
      else if (seenCodes.has(code))
        errors.push("ستون «کد کلاس» در همین فایل تکراری است.");
      else if (existingCodes.has(code))
        errors.push("این «کد کلاس» از قبل در سازمان وجود دارد.");
      if (code) seenCodes.add(code);
      if (!row.name?.trim()) errors.push("ستون «نام کلاس» الزامی است.");
      if (!this.isAcademicYear(row.schoolYear))
        errors.push("ستون «سال تحصیلی» باید دو سال پیاپی باشد.");
      if (
        row.capacity !== undefined &&
        (row.capacity < 1 || row.capacity > 200)
      )
        errors.push("ستون «ظرفیت» باید بین ۱ تا ۲۰۰ باشد.");
      return {
        row: index + 2,
        code: row.code,
        name: row.name,
        schoolYear: row.schoolYear,
        capacity: row.capacity,
        errors,
      };
    });
    const invalid = inspected.filter((row) => row.errors.length).length;
    return {
      total: rows.length,
      valid: rows.length - invalid,
      invalid,
      rows: inspected,
    };
  }
  private assertSchoolYear(value: string) {
    if (!this.isAcademicYear(value))
      throw new ApiException(
        422,
        "SCHOOL_YEAR_INVALID",
        "سال تحصیلی باید از دو سال پیاپی تشکیل شود.",
      );
  }
  private isAcademicYear(value: string) {
    const match = /^(\d{4})-(\d{4})$/.exec(value?.trim());
    if (!match) return false;
    const start = Number(match[1]);
    const end = Number(match[2]);
    return start >= 1405 && start <= 1430 && end === start + 1;
  }
  private normalizedAcademicYear(value: string) {
    if (this.isAcademicYear(value)) return value.trim();
    const start = Number(value);
    return Number.isInteger(start) && start >= 1405 && start <= 1430
      ? `${start}-${start + 1}`
      : value;
  }
  private async resolveTeacher(organizationId: string, userId: string) {
    const member = await this.staffMember(organizationId, userId);
    if (!member.roles.includes("TEACHER"))
      throw new ApiException(
        422,
        "CLASS_TEACHER_INVALID",
        "دبیر باید عضو فعال همین سازمان باشد.",
      );
    return member.user;
  }
  private async resolveAdvisor(organizationId: string, userId?: string | null) {
    if (!userId) return null;
    const member = await this.staffMember(organizationId, userId);
    if (!member.roles.some((role) => role === "ADVISOR" || role === "MENTOR"))
      throw new ApiException(
        422,
        "CLASS_ADVISOR_INVALID",
        "مشاور باید عضو فعال همین سازمان باشد.",
      );
    return member.user;
  }
  private async staffMember(organizationId: string, userId: string) {
    const member = await this.memberships.findOne({
      where: {
        organization: { id: organizationId },
        user: { id: userId },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: true, roleAssignments: { role: true } },
    });
    if (!member)
      throw new ApiException(
        422,
        "CLASS_STAFF_INVALID",
        "عضو فعال سازمان پیدا نشد.",
      );
    return {
      user: member.user,
      roles: member.roleAssignments.map((assignment) => assignment.role.code),
    };
  }
  private async staffForOrganization(organizationId: string) {
    const members = await this.memberships.find({
      where: {
        organization: { id: organizationId },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: true, roleAssignments: { role: true } },
      order: { user: { firstName: "ASC", lastName: "ASC" } },
    });
    return members
      .map((member) => ({
        id: member.user.id,
        name:
          [member.user.firstName, member.user.lastName]
            .filter(Boolean)
            .join(" ") || member.user.username,
        roles: member.roleAssignments.map((assignment) => assignment.role.code),
      }))
      .filter((member) => member.roles.length);
  }
  private async eligibleStudents(classroom: EducationClass) {
    return this.students.find({
      where: {
        organization: { id: classroom.organization.id },
        accountStatus: "active",
      },
      relations: { user: true, organization: true },
      order: { name: "ASC" },
    });
  }
  private async assertEligibleStudent(
    classroom: EducationClass,
    student: Student,
  ) {
    const matchesProfile =
      !this.hasCurriculumProfile(classroom) ||
      (student.gradeId === classroom.gradeId &&
        student.educationTypeId === classroom.educationTypeId &&
        student.trackId === classroom.trackId);
    if (!matchesProfile || student.accountStatus !== "active")
      throw new ApiException(
        422,
        "CLASS_STUDENT_PROFILE_MISMATCH",
        "دانش‌آموز باید پایه، نوع و رشتهٔ سازگار و حساب فعال داشته باشد.",
      );
    if (student.organization?.id !== classroom.organization.id)
      throw new ApiException(
        422,
        "CLASS_STUDENT_ORGANIZATION_MISMATCH",
        "دانش‌آموز متعلق به مدرسه این کلاس نیست.",
      );
  }
  private view(classroom: EducationClass, assignedTeacherId?: string) {
    const hasCurriculumProfile = this.hasCurriculumProfile(classroom);
    return {
      id: classroom.id,
      organization: {
        id: classroom.organization.id,
        name: classroom.organization.name,
        type: classroom.organization.type,
        status: classroom.organization.status,
      },
      code: classroom.code,
      name: classroom.name,
      schoolYear: this.normalizedAcademicYear(classroom.schoolYear),
      gradeId: hasCurriculumProfile ? classroom.gradeId : null,
      educationTypeId: hasCurriculumProfile ? classroom.educationTypeId : null,
      trackId: hasCurriculumProfile ? classroom.trackId : null,
      capacity: classroom.capacity,
      status: classroom.status,
      description: classroom.description,
      advisor: classroom.advisor
        ? {
            id: classroom.advisor.id,
            name:
              [classroom.advisor.firstName, classroom.advisor.lastName]
                .filter(Boolean)
                .join(" ") || classroom.advisor.username,
          }
        : null,
      books: classroom.books
        .filter(
          (item) => !assignedTeacherId || item.teacher.id === assignedTeacherId,
        )
        .map((item) => ({
          id: item.id,
          bookId: item.book.id,
          title: item.book.titleFa,
          code: item.book.textbookCode || item.book.id,
          teacher: {
            id: item.teacher.id,
            name:
              [item.teacher.firstName, item.teacher.lastName]
                .filter(Boolean)
                .join(" ") || item.teacher.username,
          },
        })),
      enrollmentCount: classroom.enrollments.length,
      students: classroom.enrollments.map((item) => ({
        id: item.student.id,
        name: item.student.name,
        grade: item.student.grade,
        major: item.student.major,
      })),
    };
  }

  private hasCurriculumProfile(classroom: EducationClass) {
    return classroom.gradeId >= 1 && classroom.gradeId <= 12;
  }
  private studentView(classroom: EducationClass) {
    const view = this.view(classroom);
    return { ...view, students: undefined };
  }
}
