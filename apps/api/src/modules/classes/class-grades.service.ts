import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { AttendanceSession } from "../../database/entities/attendance-session.entity";
import { ClassBookGradeSession } from "../../database/entities/class-book-grade-session.entity";
import { ClassBookGrade } from "../../database/entities/class-book-grade.entity";
import { EducationClassBook } from "../../database/entities/education-class-book.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import {
  CreateClassBookGradeSessionDto,
  SaveClassBookGradeDto,
  UpdateClassBookGradeSessionDto,
} from "./class-grades.dto";

@Injectable()
export class ClassGradesService {
  constructor(
    @InjectRepository(ClassBookGrade)
    private readonly grades: Repository<ClassBookGrade>,
    @InjectRepository(ClassBookGradeSession)
    private readonly sessions: Repository<ClassBookGradeSession>,
    @InjectRepository(EducationClassBook)
    private readonly classBooks: Repository<EducationClassBook>,
    @InjectRepository(EducationClassEnrollment)
    private readonly enrollments: Repository<EducationClassEnrollment>,
    @InjectRepository(AttendanceSession)
    private readonly attendance: Repository<AttendanceSession>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  private forbidden(): never {
    throw new ApiException(
      403,
      "CLASS_GRADE_FORBIDDEN",
      "دسترسی به نمره‌های این کتاب ندارید.",
    );
  }

  private async assignedBook(
    actor: AuthenticatedUser,
    id: string,
    write: boolean,
  ) {
    const classBook = await this.classBooks.findOne({
      where: { id },
      relations: {
        classroom: { organization: true },
        book: true,
        teacher: true,
      },
    });
    if (!classBook)
      throw new ApiException(
        404,
        "CLASS_BOOK_NOT_FOUND",
        "کتاب کلاس پیدا نشد.",
      );
    const organizationId = classBook.classroom.organization.id;
    if (
      !actor.organizationIds?.includes(organizationId) ||
      (actor.activeOrganizationId &&
        actor.activeOrganizationId !== organizationId)
    )
      this.forbidden();
    const principal = actor.role === "PRINCIPAL";
    const rem = actor.role === "RELIGIOUS_EDUCATION_MANAGER";
    const teacher =
      actor.role === "TEACHER" && classBook.teacher.id === actor.id;
    if (write ? !(principal || teacher) : !(principal || rem || teacher))
      this.forbidden();
    if (write && classBook.classroom.status !== "ACTIVE")
      throw new ApiException(
        409,
        "CLASS_ARCHIVED",
        "نمرهٔ کلاس بایگانی‌شده قابل تغییر نیست.",
      );
    return classBook;
  }

  private async assignedSession(
    actor: AuthenticatedUser,
    bookId: string,
    sessionId: string,
    write: boolean,
  ) {
    const book = await this.assignedBook(actor, bookId, write);
    const session = await this.sessions.findOne({
      where: { id: sessionId, classBook: { id: book.id } },
    });
    if (!session)
      throw new ApiException(
        404,
        "CLASS_GRADE_SESSION_NOT_FOUND",
        "جلسهٔ نمره‌دهی پیدا نشد.",
      );
    return { book, session };
  }

  private view(grade: ClassBookGrade) {
    return {
      id: grade.id,
      studentId: grade.student.id,
      score: grade.score,
      note: grade.note,
      principalEdited: Boolean(grade.principalEditedAt),
      principalEditedAt: grade.principalEditedAt,
      updatedAt: grade.updatedAt,
    };
  }

  private validateDate(heldOn: string) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(heldOn) ||
      Number.isNaN(Date.parse(`${heldOn}T00:00:00.000Z`)) ||
      new Date(`${heldOn}T00:00:00.000Z`).toISOString().slice(0, 10) !== heldOn
    )
      throw new ApiException(
        422,
        "INVALID_GRADE_SESSION_DATE",
        "تاریخ جلسه معتبر نیست.",
      );
  }

  async list(actor: AuthenticatedUser, classBookId: string) {
    const classBook = await this.assignedBook(actor, classBookId, false);
    const [enrollments, sessions] = await Promise.all([
      this.enrollments.find({
        where: { classroom: { id: classBook.classroom.id } },
        relations: { student: true },
      }),
      this.sessions.find({
        where: { classBook: { id: classBook.id } },
        order: { heldOn: "DESC", createdAt: "DESC" },
      }),
    ]);
    const grades = await this.grades.find({
      where: { session: { classBook: { id: classBook.id } } },
      relations: { session: true, student: true },
    });
    return {
      classBookId: classBook.id,
      className: classBook.classroom.name,
      bookTitle: classBook.book.titleFa,
      teacher: {
        id: classBook.teacher.id,
        name:
          [classBook.teacher.firstName, classBook.teacher.lastName]
            .filter(Boolean)
            .join(" ") || classBook.teacher.username,
        username: classBook.teacher.username,
      },
      students: enrollments
        .map((row) => ({ id: row.student.id, name: row.student.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "fa")),
      sessions: sessions.map((session) => ({
        id: session.id,
        title: session.title,
        heldOn: session.heldOn,
        description: session.description,
        grades: grades
          .filter((grade) => grade.session.id === session.id)
          .map((grade) => this.view(grade)),
      })),
    };
  }

  async createSession(
    actor: AuthenticatedUser,
    bookId: string,
    dto: CreateClassBookGradeSessionDto,
  ) {
    const book = await this.assignedBook(actor, bookId, true);
    const editor = await this.users.findOneBy({ id: actor.id });
    if (!editor) this.forbidden();
    const title = dto.title.trim();
    this.validateDate(dto.heldOn);
    if (title.length < 2)
      throw new ApiException(
        422,
        "INVALID_GRADE_SESSION_TITLE",
        "عنوان جلسه لازم است.",
      );
    return this.sessions.save(
      this.sessions.create({
        classBook: book,
        title,
        heldOn: dto.heldOn.slice(0, 10),
        description: dto.description?.trim() ?? "",
        createdBy: editor!,
      }),
    );
  }

  async updateSession(
    actor: AuthenticatedUser,
    bookId: string,
    sessionId: string,
    dto: UpdateClassBookGradeSessionDto,
  ) {
    const { session } = await this.assignedSession(
      actor,
      bookId,
      sessionId,
      true,
    );
    if (dto.heldOn !== undefined) this.validateDate(dto.heldOn);
    if (dto.title !== undefined && dto.title.trim().length < 2)
      throw new ApiException(
        422,
        "INVALID_GRADE_SESSION_TITLE",
        "عنوان جلسه لازم است.",
      );
    session.title = dto.title?.trim() ?? session.title;
    session.heldOn = dto.heldOn ?? session.heldOn;
    session.description = dto.description?.trim() ?? session.description;
    return this.sessions.save(session);
  }

  async removeSession(
    actor: AuthenticatedUser,
    bookId: string,
    sessionId: string,
  ) {
    await this.assignedSession(actor, bookId, sessionId, true);
    if (await this.grades.exists({ where: { session: { id: sessionId } } }))
      throw new ApiException(
        409,
        "CLASS_GRADE_SESSION_HAS_GRADES",
        "ابتدا نمره‌های این جلسه را حذف کنید.",
      );
    await this.sessions.delete({ id: sessionId });
    return { deleted: true };
  }

  async save(
    actor: AuthenticatedUser,
    bookId: string,
    sessionId: string,
    dto: SaveClassBookGradeDto,
  ) {
    const { book, session } = await this.assignedSession(
      actor,
      bookId,
      sessionId,
      true,
    );
    const enrolled = await this.enrollments.exists({
      where: {
        classroom: { id: book.classroom.id },
        student: { id: dto.studentId },
      },
    });
    if (!enrolled)
      throw new ApiException(
        422,
        "STUDENT_NOT_ENROLLED",
        "دانش‌آموز عضو این کلاس نیست.",
      );
    const student = await this.students.findOneBy({ id: dto.studentId });
    const editor = await this.users.findOneBy({ id: actor.id });
    if (!student || !editor) this.forbidden();
    const existing = await this.grades.findOne({
      where: { session: { id: session.id }, student: { id: dto.studentId } },
      relations: { student: true },
    });
    const row = this.grades.create({
      ...(existing || {}),
      session,
      student: student!,
      score: dto.score,
      note: dto.note.trim(),
      updatedBy: editor!,
      principalEditedAt:
        actor.role === "PRINCIPAL"
          ? new Date()
          : (existing?.principalEditedAt ?? null),
    });
    return this.view(await this.grades.save(row));
  }

  async remove(
    actor: AuthenticatedUser,
    bookId: string,
    sessionId: string,
    studentId: string,
  ) {
    await this.assignedSession(actor, bookId, sessionId, true);
    const result = await this.grades.delete({
      session: { id: sessionId },
      student: { id: studentId },
    });
    if (!result.affected)
      throw new ApiException(404, "CLASS_GRADE_NOT_FOUND", "نمره پیدا نشد.");
    return { deleted: true };
  }

  async attendanceSessions(actor: AuthenticatedUser, bookId: string, page = 1) {
    const book = await this.assignedBook(actor, bookId, false);
    const safePage = Number.isInteger(page)
      ? Math.max(1, Math.min(page, 10000))
      : 1;
    const [rows, total] = await this.attendance.findAndCount({
      where: {
        organization: { id: book.classroom.organization.id },
        contextType: "class",
        contextId: book.classroom.id,
        subjectIdSnapshot: book.book.id,
      },
      relations: { records: { student: true } },
      order: { sessionDate: "DESC", id: "DESC" },
      skip: (safePage - 1) * 20,
      take: 20,
    });
    return {
      page: safePage,
      total,
      hasNext: safePage * 20 < total,
      items: rows.map((row) => ({
        id: row.id,
        title: row.titleSnapshot,
        date: row.operationalDate ?? row.sessionDate.toISOString().slice(0, 10),
        status: row.status,
        records: row.records.map((record) => ({
          studentId: record.student.id,
          status: record.status,
        })),
      })),
    };
  }

  async mine(actor: AuthenticatedUser) {
    if (actor.role !== "STUDENT") this.forbidden();
    const student = await this.students.findOne({
      where: { user: { id: actor.id } },
    });
    if (!student || student.accountStatus !== "active") this.forbidden();
    const grades = await this.grades.find({
      where: { student: { id: student.id } },
      relations: {
        student: true,
        session: {
          classBook: {
            classroom: { organization: true },
            book: true,
            teacher: true,
          },
        },
      },
      order: { updatedAt: "DESC" },
    });
    return grades
      .filter(
        (row) =>
          actor.organizationIds?.includes(
            row.session.classBook.classroom.organization.id,
          ) &&
          (!actor.activeOrganizationId ||
            actor.activeOrganizationId ===
              row.session.classBook.classroom.organization.id),
      )
      .map((row) => ({
        ...this.view(row),
        sessionTitle: row.session.title,
        heldOn: row.session.heldOn,
        className: row.session.classBook.classroom.name,
        schoolYear: row.session.classBook.classroom.schoolYear,
        bookTitle: row.session.classBook.book.titleFa,
        teacherName:
          [
            row.session.classBook.teacher.firstName,
            row.session.classBook.teacher.lastName,
          ]
            .filter(Boolean)
            .join(" ") || row.session.classBook.teacher.username,
      }));
  }
}
