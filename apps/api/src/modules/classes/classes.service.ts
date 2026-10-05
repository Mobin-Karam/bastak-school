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
    const allowedOrganizations = this.isPlatform(context)
      ? organizationId
        ? [organizationId]
        : undefined
      : context.organizationIds;
    if (organizationId && !this.canReadOrganization(context, organizationId))
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
      .map((row) => this.view(row));
  }

  async assigned(actor: AuthenticatedUser, studentId?: string) {
    const context = this.context(actor);
    this.authorization.requireCapability(context, "classes.read");
    const student = studentId
      ? await this.students.findOne({
          where: { id: studentId },
          relations: { user: true },
        })
      : await this.students.findOne({
          where: { user: { id: actor.id } },
          relations: { user: true },
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
        classroom.gradeId,
        classroom.educationTypeId,
        classroom.trackId,
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
          member.roles.includes("ADVISOR") || member.roles.includes("MENTOR"),
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
    const advisor = await this.resolveAdvisor(
      dto.organizationId,
      dto.advisorId,
    );
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
        gradeId: dto.gradeId,
        educationTypeId: dto.educationTypeId.trim(),
        trackId: dto.trackId.trim(),
        capacity: dto.capacity ?? 35,
        description: dto.description?.trim() || "",
        advisor,
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
    const profileChanged =
      dto.gradeId !== undefined ||
      dto.educationTypeId !== undefined ||
      dto.trackId !== undefined ||
      dto.schoolYear !== undefined;
    if (profileChanged && classroom.books.length)
      throw new ApiException(
        409,
        "CLASS_PROFILE_LOCKED",
        "برای تغییر پایه، نوع، رشته یا سال، ابتدا کتاب‌های کلاس را بازبینی کنید.",
      );
    const advisor =
      dto.advisorId === undefined
        ? classroom.advisor
        : await this.resolveAdvisor(classroom.organization.id, dto.advisorId);
    Object.assign(classroom, {
      ...(dto.code !== undefined
        ? { code: dto.code.trim().toLowerCase() }
        : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.schoolYear !== undefined
        ? { schoolYear: dto.schoolYear.trim() }
        : {}),
      ...(dto.gradeId !== undefined ? { gradeId: dto.gradeId } : {}),
      ...(dto.educationTypeId !== undefined
        ? { educationTypeId: dto.educationTypeId.trim() }
        : {}),
      ...(dto.trackId !== undefined ? { trackId: dto.trackId.trim() } : {}),
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
      "classes.manage",
      true,
    );
    const requested = dto.books || [];
    const eligible = await this.catalog.listBooks(
      classroom.gradeId,
      classroom.educationTypeId,
      classroom.trackId,
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
          relations: { user: true },
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
      (context.roles.includes("ORGANIZATION_ADMIN") &&
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
    const members = await this.memberships.find({
      where: {
        organization: { id: classroom.organization.id },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: { student: true } },
    });
    return members
      .map((member) => member.user.student)
      .filter((student): student is Student => {
        if (!student) return false;
        return (
          student.gradeId === classroom.gradeId &&
          student.educationTypeId === classroom.educationTypeId &&
          student.trackId === classroom.trackId &&
          student.accountStatus === "active"
        );
      });
  }
  private async assertEligibleStudent(
    classroom: EducationClass,
    student: Student,
  ) {
    const matchesProfile =
      student.gradeId === classroom.gradeId &&
      student.educationTypeId === classroom.educationTypeId &&
      student.trackId === classroom.trackId;
    if (!matchesProfile || student.accountStatus !== "active")
      throw new ApiException(
        422,
        "CLASS_STUDENT_PROFILE_MISMATCH",
        "دانش‌آموز باید پایه، نوع و رشتهٔ سازگار و حساب فعال داشته باشد.",
      );
    const membership = student.user
      ? await this.memberships.findOne({
          where: {
            organization: { id: classroom.organization.id },
            user: { id: student.user.id },
            status: MembershipStatus.ACTIVE,
          },
        })
      : null;
    if (!membership)
      throw new ApiException(
        422,
        "CLASS_STUDENT_ORGANIZATION_MISMATCH",
        "دانش‌آموز عضو فعال سازمان کلاس نیست.",
      );
  }
  private view(classroom: EducationClass) {
    return {
      id: classroom.id,
      organization: {
        id: classroom.organization.id,
        name: classroom.organization.name,
      },
      code: classroom.code,
      name: classroom.name,
      schoolYear: classroom.schoolYear,
      gradeId: classroom.gradeId,
      educationTypeId: classroom.educationTypeId,
      trackId: classroom.trackId,
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
      books: classroom.books.map((item) => ({
        id: item.id,
        bookId: item.book.id,
        title: item.book.titleFa,
        category: item.book.category,
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
  private studentView(classroom: EducationClass) {
    const view = this.view(classroom);
    return { ...view, students: undefined };
  }
}
