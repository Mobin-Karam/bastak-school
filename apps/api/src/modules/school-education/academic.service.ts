import { SchoolScheduleEntry } from "../../database/entities/school-schedule-entry.entity";
import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  TeachingAssignment,
  SubjectBookReference,
} from "../../database/entities/academic-structure.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationBook } from "../../database/entities/education-book.entity";
import { Subject } from "../../database/entities/subject.entity";
import {
  TimetableAcademicYear,
  TimetableTerm,
} from "../../database/entities/timetable.entity";
import {
  OrganizationMembership,
  MembershipStatus,
} from "../../database/entities/organization-membership.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { UserStatus } from "../../database/entities/user.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { attendanceTransaction } from "../attendance";
import {
  AcademicPageDto,
  AcademicSubjectDto,
  TeachingAssignmentDto,
  SubjectBookReferenceDto,
  EndTeachingAssignmentDto,
} from "./academic.dto";

@Injectable()
export class AcademicService {
  constructor(
    private readonly db: DataSource,
    private readonly access: SchoolAccessService,
  ) {}
  private fail(code: string, message: string, status = 422): never {
    throw new ApiException(status, code, message);
  }
  private async school(
    user: AuthenticatedUser,
    org: string,
    capability: string,
  ) {
    if (!user.capabilities?.includes(capability))
      this.fail("FORBIDDEN", "دسترسی کافی ندارید.", 403);
    return this.access.organizationForUser(user, org);
  }
  private async subject(m: EntityManager, id: string, org: string) {
    const subject = await m.findOne(Subject, {
      where: { id, active: true },
      relations: { organization: true },
    });
    if (!subject || (subject.organization && subject.organization.id !== org))
      this.fail("ACADEMIC_SUBJECT_SCOPE", "درس خارج از مدرسه است.");
    return subject;
  }

  async subjects(user: AuthenticatedUser, org: string, page: AcademicPageDto) {
    await this.school(user, org, "education.catalog.read");
    const [items, total] = await this.db.manager.findAndCount(Subject, {
      where: { organization: { id: org }, active: true },
      order: { name: "ASC", id: "ASC" },
      skip: page.offset,
      take: page.limit,
    });
    return { items, total, offset: page.offset, limit: page.limit };
  }
  async createSubject(
    user: AuthenticatedUser,
    org: string,
    dto: AcademicSubjectDto,
  ) {
    await this.school(user, org, "education.catalog.manage");
    return attendanceTransaction(this.db.manager, async (m) => {
      const code = dto.code.trim().toLowerCase(),
        name = dto.name.trim(),
        category = dto.category?.trim() || "عمومی";
      if (!name) this.fail("ACADEMIC_SUBJECT_NAME", "نام درس لازم است.");
      if (
        await m.exists(Subject, { where: { organization: { id: org }, code } })
      )
        this.fail("SUBJECT_CODE_EXISTS", "کلید درس تکراری است.", 409);
      const row = await m.save(
        Subject,
        m.create(Subject, {
          organization: { id: org },
          code,
          name,
          category,
          active: true,
        }),
      );
      await this.audit(m, user, org, "academic.subject.created", {
        subjectId: row.id,
      });
      return row;
    });
  }
  async teachers(user: AuthenticatedUser, org: string, page: AcademicPageDto) {
    await this.school(user, org, "classes.read");
    if (
      !user.capabilities?.includes("schedule.read.all") &&
      !user.capabilities?.includes("classes.manage")
    )
      this.fail("FORBIDDEN", "فهرست کارکنان فقط برای مسئول مدرسه است.", 403);
    const [rows, total] = await this.db.manager.findAndCount(
      UserRoleAssignment,
      {
        where: {
          role: { code: "TEACHER" },
          membership: {
            organization: { id: org },
            status: MembershipStatus.ACTIVE,
          },
          user: { status: UserStatus.ACTIVE },
        },
        relations: { user: true, membership: true },
        order: { id: "ASC" },
        skip: page.offset,
        take: page.limit,
      },
    );
    return {
      items: rows.map((r) => ({
        id: r.user.id,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        username: r.user.username,
        membershipId: r.membership?.id,
      })),
      total,
      offset: page.offset,
      limit: page.limit,
    };
  }
  async assignments(
    user: AuthenticatedUser,
    org: string,
    page: AcademicPageDto,
  ) {
    await this.school(user, org, "classes.read");
    const full =
      user.capabilities?.includes("classes.manage") ||
      user.capabilities?.includes("schedule.read.all");
    if (!full && page.teacherId && page.teacherId !== user.id)
      this.fail("FORBIDDEN", "فقط تخصیص‌های خودتان در دسترس است.", 403);
    const [items, total] = await this.db.manager.findAndCount(
      TeachingAssignment,
      {
        where: {
          organizationId: org,
          ...(!full
            ? { teacherId: user.id }
            : page.teacherId
              ? { teacherId: page.teacherId }
              : {}),
          ...(page.classroomId ? { classroomId: page.classroomId } : {}),
          ...(page.academicYearId
            ? { academicYearId: page.academicYearId }
            : {}),
        },
        order: { startsOn: "DESC", id: "ASC" },
        skip: page.offset,
        take: page.limit,
      },
    );
    return { items, total, offset: page.offset, limit: page.limit };
  }
  async createAssignment(
    user: AuthenticatedUser,
    org: string,
    dto: TeachingAssignmentDto,
  ) {
    await this.school(user, org, "classes.manage");
    return attendanceTransaction(this.db.manager, async (m) => {
      const year = await m.findOneBy(TimetableAcademicYear, {
        id: dto.academicYearId,
        organizationId: org,
      });
      const classroom = await m.findOne(EducationClass, {
        where: {
          id: dto.classroomId,
          organization: { id: org },
          status: "ACTIVE",
        },
      });
      const term = dto.termId
        ? await m.findOneBy(TimetableTerm, {
            id: dto.termId,
            yearId: dto.academicYearId,
          })
        : null;
      if (
        !year ||
        !classroom ||
        classroom.academicYearId !== year.id ||
        (dto.termId && !term)
      )
        this.fail("ACADEMIC_SCOPE", "کلاس، سال و نیم‌سال باید هم‌دامنه باشند.");
      const start = term?.startsOn ?? year.startsOn,
        end = term?.endsOn ?? year.endsOn;
      if (dto.startsOn < start || dto.endsOn > end || dto.endsOn < dto.startsOn)
        this.fail("ACADEMIC_DATE_RANGE", "تخصیص خارج از بازه تحصیلی است.");
      await this.subject(m, dto.subjectId, org);
      const roles = await m.find(UserRoleAssignment, {
        where: {
          user: { id: dto.teacherId, status: UserStatus.ACTIVE },
          role: { code: "TEACHER" },
          membership: {
            organization: { id: org },
            status: MembershipStatus.ACTIVE,
          },
        },
      });
      if (!roles.length)
        this.fail(
          "ACADEMIC_TEACHER_SCOPE",
          "استاد باید حساب فعال تدریس در مدرسه داشته باشد.",
        );
      const duplicate = await m
        .getRepository(TeachingAssignment)
        .createQueryBuilder("a")
        .where(
          "a.organizationId = :org AND a.classroomId = :classroom AND a.subjectId = :subject AND a.teacherId = :teacher AND a.status = :status",
          {
            org,
            classroom: dto.classroomId,
            subject: dto.subjectId,
            teacher: dto.teacherId,
            status: "ACTIVE",
          },
        )
        .andWhere("a.startsOn <= :end AND a.endsOn >= :start", {
          start: dto.startsOn,
          end: dto.endsOn,
        })
        .getExists();
      if (duplicate)
        this.fail(
          "ACADEMIC_ASSIGNMENT_OVERLAP",
          "تخصیص هم‌پوشان برای همین کلاس، درس و استاد وجود دارد.",
          409,
        );
      const row = await m.save(
        TeachingAssignment,
        m.create(TeachingAssignment, {
          ...dto,
          organizationId: org,
          termId: dto.termId ?? null,
          status: "ACTIVE",
          createdById: user.id,
        }),
      );
      await this.audit(m, user, org, "academic.assignment.created", {
        assignmentId: row.id,
      });
      return row;
    });
  }
  async endAssignment(
    user: AuthenticatedUser,
    org: string,
    id: string,
    dto: EndTeachingAssignmentDto,
  ) {
    await this.school(user, org, "classes.manage");
    return attendanceTransaction(this.db.manager, async (m) => {
      const row = await m.findOneBy(TeachingAssignment, {
        id,
        organizationId: org,
        status: "ACTIVE",
      });
      if (!row)
        this.fail("ACADEMIC_ASSIGNMENT_NOT_FOUND", "تخصیص پیدا نشد.", 404);
      if (dto.endsOn < row.startsOn || dto.endsOn > row.endsOn)
        this.fail("ACADEMIC_DATE_RANGE", "پایان باید در بازه تخصیص باشد.");
      const references = await m.findBy(SubjectBookReference, {
        organizationId: org,
        subjectId: row.subjectId,
      });
      if (references.length) {
        const affected = await m
          .getRepository(SchoolScheduleEntry)
          .createQueryBuilder("lesson")
          .innerJoin("lesson.classBook", "book")
          .innerJoin("lesson.version", "version")
          .where(
            "lesson.classroomId = :classroom AND lesson.teacherId = :teacher AND book.bookId IN (:...books) AND lesson.endsOn > :end AND lesson.status = :active AND (version.state = :draft OR version.publishedAt IS NOT NULL)",
            {
              classroom: row.classroomId,
              teacher: row.teacherId,
              books: references.map((r) => r.bookId),
              end: dto.endsOn,
              active: "ACTIVE",
              draft: "DRAFT",
            },
          )
          .getExists();
        if (affected)
          this.fail(
            "ACADEMIC_ASSIGNMENT_IN_USE",
            "ابتدا درس‌های وابسته را اصلاح کنید.",
            409,
          );
      }
      const before = { endsOn: row.endsOn, status: row.status };
      row.endsOn = dto.endsOn;
      row.status = "ENDED";
      await m.save(row);
      await this.audit(m, user, org, "academic.assignment.ended", {
        assignmentId: id,
        before,
        after: { endsOn: row.endsOn, status: row.status },
        reason: dto.reason,
      });
      return row;
    });
  }
  async reference(
    user: AuthenticatedUser,
    org: string,
    dto: SubjectBookReferenceDto,
  ) {
    await this.school(user, org, "education.catalog.manage");
    return attendanceTransaction(this.db.manager, async (m) => {
      await this.subject(m, dto.subjectId, org);
      const book = await m.findOneBy(EducationBook, {
        id: dto.bookId,
        state: "PUBLISHED",
      });
      if (!book || (book.organizationId && book.organizationId !== org))
        this.fail("ACADEMIC_BOOK_SCOPE", "کتاب متعلق به دامنه مدرسه نیست.");
      const existing = await m.findOneBy(SubjectBookReference, {
        organizationId: org,
        subjectId: dto.subjectId,
        bookId: dto.bookId,
      });
      if (existing) return existing;
      const row = await m.save(
        SubjectBookReference,
        m.create(SubjectBookReference, { ...dto, organizationId: org }),
      );
      await this.audit(m, user, org, "academic.subject.book.linked", {
        referenceId: row.id,
      });
      return row;
    });
  }
  async references(
    user: AuthenticatedUser,
    org: string,
    page: AcademicPageDto,
  ) {
    await this.school(user, org, "education.catalog.read");
    const [items, total] = await this.db.manager.findAndCount(
      SubjectBookReference,
      {
        where: { organizationId: org },
        order: { id: "ASC" },
        skip: page.offset,
        take: page.limit,
      },
    );
    return { items, total, offset: page.offset, limit: page.limit };
  }
  private audit(
    m: EntityManager,
    user: AuthenticatedUser,
    org: string,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    return m.save(
      AuditLog,
      m.create(AuditLog, {
        user: { id: user.id },
        organizationId: org,
        action,
        entity: "academic",
        metadata,
      }),
    );
  }
}
